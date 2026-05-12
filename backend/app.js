import express from "express";
import cors from "cors";
import dataRoutes from "./routes/route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", dataRoutes)
app.use("/uploads", express.static("uploads"));

app.listen(8000, () => {
    console.log("Server started on port 8000");
});