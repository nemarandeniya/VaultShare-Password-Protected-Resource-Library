import express from "express";
import multer from "multer";
import pool from "../db.js"; // adjust path to your mysql2 pool
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const dataRoutes = express.Router();
import dotenv from "dotenv"
dotenv.config()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024, fieldSize: 10 * 1024 * 1024 } });

dataRoutes.post("/add", upload.array("files", 10), async (req, res) => {

    const connection = await pool.getConnection();

    try {
        console.log("req.body:", req.body);

        const { link, topic, description, type, password } = req.body;
        const files = req.files || [];

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null

        await connection.beginTransaction();

        // insert entry
        const [result] = await connection.execute(
            `INSERT INTO Data_table (topic, description, type, link,password) VALUES (?, ?, ?, ?,?)`,
            [topic, description, type, link || null, hashedPassword]
        );

        const newId = result.insertId;

        // insert files (if any)
        for (const file of files) {
            await connection.execute(
                `INSERT INTO Data_files (Datatable_id, original_name, file_name, path) VALUES (?, ?, ?, ?)`,
                [newId, file.originalname, file.filename, file.path]
            );
        }

        await connection.commit();

        const fileData = files.map(file => ({
            originalName: file.originalname,
            fileName: file.filename,
            path: file.path
        }));

        const saveData = {
            id: newId,
            topic,
            description,
            type,
            link: link || null,
            protected: !!hashedPassword,
            files: fileData
        };

        return res.json({ message: "Data added successfully", data: saveData });

    } catch (error) {
        await connection.rollback();
        console.error("UPLOAD ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    } finally {
        connection.release();
    }
});

dataRoutes.get("/get", async (req, res) => {

    try {
        const [entries] = await pool.execute(`SELECT * FROM Data_table ORDER BY id`);

        if (entries.length === 0) {
            return res.json([]);
        }

        const entryIds = entries.map(e => e.id);
        const placeholders = entryIds.map(() => "?").join(",");

        const [files] = await pool.execute(
            `SELECT * FROM Data_files WHERE Datatable_id IN (${placeholders})`,
            entryIds
        );

        // group files by entry_id
        const filesByEntry = {};
        for (const f of files) {
            if (!filesByEntry[f.Datatable_id]) filesByEntry[f.Datatable_id] = [];
            filesByEntry[f.Datatable_id].push({
                originalName: f.original_name,
                fileName: f.file_name,
                path: f.path
            });
        }

        const data = entries.map(e => ({
            id: e.id,
            topic: e.topic,
            description: e.description,
            type: e.type,
            link: e.link,
            protected: !!e.protected,
            files: filesByEntry[e.id] || []
        }));

        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error reading data" });
    }
});

dataRoutes.post("/verify/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { password } = req.body;

    try {
        const [rows] = await pool.execute(
            `SELECT password FROM Data_table WHERE id = ?`,
            [id]
        );

        const entry = rows[0];
        if (!entry) {
            return res.status(404).json({ valid: false, message: "Not found" });
        }

        // not protected at all — treat as valid
        if (!entry.password) {
            return res.json({ valid: true });
        }

        const isValid = await bcrypt.compare(password || "", entry.password);
        if (!isValid) {
            return res.status(401).json({ valid: false, message: "Incorrect password" });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error("VERIFY ERROR:", error);
        res.status(500).json({ valid: false, message: "Server error" });
    }
})

dataRoutes.put("/update/:id", upload.array("files", 10), async (req, res) => {

    const id = Number(req.params.id);
    const { topic, description, type, link, removedFiles, password, remo } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // resolve what the password column should become:
        // - removePassword=true -> clear it
        // - a new non-empty password -> hash and set it
        // - otherwise -> leave the existing value untouched
        let resolvedPassword;
        if (removePassword === "true") {
            resolvedPassword = null;
        } else if (password) {
            resolvedPassword = await bcrypt.hash(password, 10);
        } else {
            const [currentRows] = await connection.execute(
                `SELECT password FROM Data_table WHERE id = ?`,
                [id]
            );
            resolvedPassword = currentRows[0]?.password ?? null;
        }

        if (type === "link") {
            await connection.execute(
                `UPDATE Data_table SET topic = ?, description = ?, type = ?, link = ?, password = ? WHERE id = ?`,
                [topic, description, type, link, resolvedPassword, id]
            );

            // remove all files for this entry
            await connection.execute(`DELETE FROM Data_files WHERE Datatable_id = ?`, [id]);

            await connection.commit();
            return res.json({ message: "Updated successfully" });
        }

        // update entry fields (link cleared for file/other types)
        await connection.execute(
            `UPDATE Data_table SET topic = ?, description = ?, type = ?, link = NULL WHERE id = ?`,
            [topic, description, type, id]
        );

        // remove specified files
        const removed = removedFiles ? JSON.parse(removedFiles) : [];
        if (removed.length > 0) {
            const placeholders = removed.map(() => "?").join(",");
            await connection.execute(
                `DELETE FROM Data_files WHERE Datatable_id = ? AND file_name IN (${placeholders})`,
                [id, ...removed]
            );
        }

        // insert new files
        const newFiles = req.files || [];
        for (const file of newFiles) {
            await connection.execute(
                `INSERT INTO Data_files (Datatable_id, original_name, file_name, path) VALUES (?, ?, ?, ?)`,
                [id, file.originalname, file.filename, file.path]
            );
        }

        await connection.commit();
        res.json({ message: "Updated successfully" });

    } catch (error) {
        await connection.rollback();
        console.error("UPDATE ERROR:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    } finally {
        connection.release();
    }
});

dataRoutes.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.execute(
            `SELECT id, username, password FROM users WHERE username = ?`,
            [username]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // await pool.execute(`UPDATE users SET token = ? WHERE id = ?`, [token, user.id]);

        res.json({
            token,
            user: { id: user.id, username: user.username }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

dataRoutes.post("/register", async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);

    try {
        const [existingRows] = await pool.execute(
            `SELECT id FROM users WHERE username = ?`,
            [username]
        );

        if (existingRows.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const generatedUserId = `USR-${Date.now()}`;

        // add new user
        const [result] = await pool.execute(
            `INSERT INTO users (userId, username, password) VALUES (?, ?, ?)`,
            [generatedUserId, username, hashedPassword]
        );

        const [newUserRows] = await pool.execute(
            `SELECT id, userId, username FROM users WHERE id = ?`,
            [result.insertId]
        );

        const newUser = newUserRows[0];
        console.log(newUser);

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("createUser error:", error);

        res.status(500).json({ message: error.message });
    }
});

export default dataRoutes;