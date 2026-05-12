import express from "express";
import fs from "fs";
import multer from "multer";

const dataRoutes = express.Router();

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

    try {
        console.log("req.body:", req.body);
        //read existing file
        let oldData = [];

        try {
            const data = fs.readFileSync("data.json", "utf-8");
            oldData = data ? JSON.parse(data) : [];
        } catch (err) {
            oldData = [];
        }
        const newData = req.body;
        const newId = oldData.length > 0
            ? oldData[oldData.length - 1].id + 1
            : 1;

        const { link, topic, description } = req.body;
        //file info
        // const isFile = req.file
        const files = req.files || [];

        const fileData = files.map(file => ({
            originalName: file.originalname,
            fileName: file.filename,
            path: file.path
        }))


        console.log("REQ FILE:", req.files);


        const saveData = {
            id: newId,
            topic,
            description,
            type: req.body.type,
            link: link || null,
            files: fileData
            // fileName: isFile ? req.file.filename : link || null,
            // fileType: isFile ? req.file.mimetype : null,
        };

        //add new data
        oldData.push(saveData);

        //write data to file
        fs.writeFileSync("data.json", JSON.stringify(oldData));
        return res.json({ message: "Data added successfully", data: saveData });

    } catch (error) {
        console.error("UPLOAD ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

dataRoutes.get("/get", (req, res) => {

    try {
        const filePath = "data.json";

        let data = [];

        // check file exists
        if (fs.existsSync(filePath)) {
            data = JSON.parse(
                fs.readFileSync(filePath, "utf-8")
            );
        }
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error reading data" });
    }
});

dataRoutes.put("/update/:id", upload.array("files", 10), (req, res) => {

    const id = Number(req.params.id);

    const { topic, description, type, link, removedFiles } = req.body;

    const filePath = "data.json";
    let data = JSON.parse(fs.readFileSync(filePath));

    const updatedData = data.map((item) => {
        if (item.id === id) {
            if (type === "link") {
                return {
                    ...item,
                    topic,
                    description,
                    type,
                    link,
                    files: [],
                }
            }

            // files to remove
            const removed = removedFiles ? JSON.parse(removedFiles) : [];

            // existing files that didnt removed
            const existingFiles = (item.files || []).filter(f => !removed.includes(f.fileName));

            // new files
            const newFiles = (req.files || []).map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                path: file.path
            }))

            return {
                ...item,
                topic,
                description,
                type,
                link: null,
                files: [...existingFiles, ...newFiles]
            };
        }
        return item;
    });
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    res.json({ message: "Updated successfully" });
});

export default dataRoutes;