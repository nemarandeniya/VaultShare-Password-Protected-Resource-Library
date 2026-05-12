import { FiPlus, FiEdit, FiChevronDown, FiEye } from "react-icons/fi";
import { FaFilePdf } from "react-icons/fa";
import { MdStickyNote2 } from "react-icons/md";
import { useState, useEffect, useCallback } from "react";
import { checkAuth } from "./auth.js";
import axios from "axios";
import Materiel from "../components/Materiel.jsx";

function Appes() {

    const [auth, setAuth] = useState(null);
    const [showInputs, setIsShowInputs] = useState(false);
    const [getData, setGetData] = useState([]);
    const [editId, setEditid] = useState(null);
    const [closeCard, setCloseCard] = useState([]);

    const [data, setData] = useState({
        topic: "",
        description: ""
    });

    // ✅ material (link + files together)
    const [materialData, setMaterialData] = useState({
        link: "",
        files: []
    });

    const [editData, setEditData] = useState({
        topic: "",
        description: "",
        link: "",
        files: [],
        removedFiles: []
    });

    const [mode, setMode] = useState("view");

    // GET DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:8000/get");
                setGetData(response.data);
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, []);

    // AUTH
    useEffect(() => {
        async function loadAuth() {
            const auth = await checkAuth();
            setAuth(auth);
        }
        loadAuth();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ CREATE (FIXED)
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();

            formData.append("topic", data.topic);
            formData.append("description", data.description);

            // ✅ link + files together
            if (materialData.link) {
                formData.append("link", materialData.link);
            }

            if (materialData.files && materialData.files.length > 0) {
                materialData.files.forEach(file => {
                    formData.append("files", file);
                });
            }

            const response = await axios.post(
                "http://localhost:8000/add",
                formData
            );

            console.log(response.data);

            setData({ topic: "", description: "" });
            setMaterialData({ link: "", files: [] });

        } catch (error) {
            console.log(error);
        }
    };

    const handleMaterialChange = useCallback((val) => {
        setMaterialData(val);
    }, []);

    const handleUpdate = async (id) => {
        try {
            const formData = new FormData();

            formData.append("topic", editData.topic);
            formData.append("description", editData.description);

            const item = getData.find((i) => i.id === id);

            // link
            if (item.link || editData.link) {
                formData.append("link", editData.link || item.link);
            }

            // files
            if (editData.files.length > 0) {
                editData.files.forEach(file => {
                    formData.append("files", file);
                });
            }

            const response = await axios.put(
                `http://localhost:8000/update/${id}`,
                formData
            );

            console.log(response.data);

            setGetData((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            topic: editData.topic,
                            description: editData.description,
                            link: editData.link || item.link,
                        }
                        : item
                )
            );

            setEditid(null);

        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="min-h-screen px-4 py-6 flex justify-center bg-gradient-to-r from-[#eafaf2] to-[#f1fae1]">

            <div className="bg-white w-full max-w-4xl rounded-lg shadow-md p-4">

                {/* HEADER */}
                {auth?.isAdmin && (
                    <div className="flex gap-2 justify-center">
                        <button
                            className="bg-[#3bb961] text-white px-4 py-2 rounded-md flex items-center gap-2"
                            onClick={() => setMode("admin")}
                        >
                            <FiEdit /> Update
                        </button>

                        <button
                            className="bg-[#acb93b] text-white px-4 py-2 rounded-md flex items-center gap-2"
                            onClick={() => setMode("view")}
                        >
                            <FiEye /> View
                        </button>

                        {mode === "admin" && (
                            <button
                                onClick={() => setIsShowInputs(!showInputs)}
                                className="bg-[#3bb9af] text-white px-4 py-2 rounded-md"
                            >
                                <FiPlus />
                            </button>
                        )}
                    </div>
                )}

                {/* CREATE FORM */}
                {showInputs && mode === "admin" && (
                    <div className="mt-6 space-y-4">

                        <input
                            name="topic"
                            value={data.topic}
                            onChange={handleChange}
                            placeholder="Topic"
                            className="border p-2 w-full"
                        />

                        <input
                            name="description"
                            value={data.description}
                            onChange={handleChange}
                            placeholder="Description"
                            className="border p-2 w-full"
                        />

                        {/* MATERIAL (LINK + FILES) */}
                        <Materiel onChange={handleMaterialChange} />

                        <button
                            onClick={handleSubmit}
                            className="bg-[#3bb9af] text-white px-4 py-2 w-full"
                        >
                            Submit
                        </button>
                    </div>
                )}

                {/* LIST */}
                <div className="mt-8">

                    {getData.map((item) => (
                        <div key={item.id} className="border p-4 mb-4 rounded">

                            {/* TITLE */}
                            <h2 className="font-bold">{item.topic}</h2>
                            <p>{item.description}</p>

                            {/* LINK + FILES VIEW */}
                            <div className="mt-2">

                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        className="text-blue-600 underline block"
                                    >
                                        Open Link
                                    </a>
                                )}

                                {item.files?.map((file, i) => (
                                    <a
                                        key={i}
                                        href={`http://localhost:8000/uploads/${file.fileName}`}
                                        download
                                        className="text-blue-600 underline block"
                                    >
                                        {file.originalName}
                                    </a>
                                ))}

                            </div>

                        </div>
                    ))}

                </div>

            </div>
        </div>
    );
}

export default Appes;