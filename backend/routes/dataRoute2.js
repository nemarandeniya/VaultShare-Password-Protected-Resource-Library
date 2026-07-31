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

dataRoutes.get("/auth/me", async (req, res) => {

    try {

        const token = req.headers.authorization?.split(" ")[1];


        if (!token) {
            return res.status(401).json({
                message: "No token"
            });
        }


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        const [rows] = await pool.execute(
            `
            SELECT 
            id,
            username,
            is_admin
            FROM users
            WHERE id=?
            `,
            [decoded.id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        res.json(rows[0]);


    } catch (error) {

        console.log(error);

        res.status(401).json({
            message: "Invalid token"
        });

    }

});

dataRoutes.post("/add", upload.array("files", 10), async (req, res) => {

    const connection = await pool.getConnection();

    try {
        console.log("req.body:", req.body);

        const { link, topic, description, type, password } = req.body;
        const files = req.files || [];

        // every admin-added material must be password protected
        // if (!password) {
        //     connection.release();
        //     return res.status(400).json({ message: "A password is required for this material" });
        // }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

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
        const [entries] = await pool.execute(`SELECT dt.*,u.username FROM moodle.data_table dt join moodle.users u on dt.uploaded_by = u.id order by dt.created_at;`);
        // const [entries] = await pool.execute(`SELECT * FROM Data_table ORDER BY id`);

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
            userId: e.uploaded_by,
            userName: e.username,
            protected: !!e.password,
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
    const { topic, description, type, link, removedFiles, password, removePassword } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // password is mandatory and can never be cleared — only changed.
        // - a new non-empty password -> hash and set it
        // - otherwise -> leave the existing hash untouched
        let resolvedPassword;
        if (password) {
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
            `UPDATE Data_table SET topic = ?, description = ?, type = ?, link = NULL, password = ? WHERE id = ?`,
            [topic, description, type, resolvedPassword, id]
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


// requets handle
// dataRoutes.post("/request-password/:id", async (req, res) => {
//     const id = Number(req.params.id);
//     const { username } = req.body;

//     if (!username) {
//         return res.status(400).json({ message: "Username is required to request access" });
//     }

//     try {
//         // if there's already a pending or approved request for this user+item, don't duplicate it
//         const [existing] = await pool.execute(
//             `SELECT id, status FROM password_requests WHERE Data_table_id = ? AND username = ? ORDER BY created_at DESC LIMIT 1`,
//             [id, username]
//         );

//         if (existing.length > 0 && existing[0].status !== "denied") {
//             return res.json({ message: "Request already exists", status: existing[0].status });
//         }

//         await pool.execute(
//             `INSERT INTO password_requests (Data_table_id, username, status) VALUES (?, ?, 'pending')`,
//             [id, username]
//         );

//         res.json({ message: "Access requested", status: "pending" });
//     } catch (error) {
//         console.error("REQUEST ERROR:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// })
// request handling
dataRoutes.post("/request-password/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username is required to request access" });
    }

    try {
        const [existing] = await pool.execute(
            `SELECT id, status FROM password_requests WHERE Data_table_id = ? AND username = ?`,
            [id, username]
        );

        if (existing.length > 0) {
            const current = existing[0];

            // already pending or approved — don't touch it, just report back
            if (current.status !== "denied") {
                return res.json({ message: "Request already exists", status: current.status });
            }

            // was denied before — reuse the row, reset it to pending
            await pool.execute(
                `UPDATE password_requests SET status = 'pending', created_at = NOW() WHERE id = ?`,
                [current.id]
            );

            return res.json({ message: "Access requested", status: "pending" });
        }

        // no prior request — insert fresh
        await pool.execute(
            `INSERT INTO password_requests (Data_table_id, username, status) VALUES (?, ?, 'pending')`,
            [id, username]
        );

        res.json({ message: "Access requested", status: "pending" });
    } catch (error) {
        console.error("REQUEST ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

dataRoutes.get("/request-status/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT status FROM password_requests WHERE Data_table_id = ? AND username = ? ORDER BY created_at DESC LIMIT 1`,
            [id, username]
        );

        res.json({ status: rows[0]?.status || "none" });
    } catch (error) {
        console.error("REQUEST STATUS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// admin: list pending access requests across all items
dataRoutes.get("/password-requests", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT pr.id, pr.Data_table_id, pr.username, pr.status, pr.created_at, dt.topic
             FROM password_requests pr
             JOIN Data_table dt ON pr.Data_table_id = dt.id
             WHERE pr.status = 'pending'
             ORDER BY pr.created_at ASC`
        );

        res.json(rows);
    } catch (error) {
        console.error("LIST REQUESTS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

dataRoutes.put("/password-requests/:id/approve", async (req, res) => {
    try {
        const [result] = await pool.execute(
            `UPDATE password_requests SET status = 'approved' WHERE id = ?`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json({ message: "Request approved" });
    } catch (error) {
        console.error("APPROVE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

dataRoutes.put("/password-requests/:id/deny", async (req, res) => {
    try {
        const [result] = await pool.execute(
            `UPDATE password_requests SET status = 'denied' WHERE id = ?`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json({ message: "Request denied" });
    } catch (error) {
        console.error("DENY ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default dataRoutes;