import { FiPlus, FiEdit, FiChevronDown, FiEye, FiLink, FiLock, FiUnlock, FiLogOut } from "react-icons/fi";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileVideo, FaFileAlt } from "react-icons/fa";
import { MdStickyNote2 } from "react-icons/md";
import { useState, useEffect, useCallback } from "react";
import { checkAuth, logout } from "./auth.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Materiel from "../components/Materiel.jsx";
import DarkModeToggle from "../components/DarkModeToggle.jsx";


function MainPagetext() {

    const [auth, setAuth] = useState(null);
    const [showInputs, setIsShowInputs] = useState(false);
    const [showUpdateIcon, setShowUpdateIcon] = useState(false);
    const [data, setData] = useState({ topic: "", description: "", material: "" });
    const [getData, setGetData] = useState([]);
    const [editId, setEditid] = useState(null);
    const [closeCard, setCloseCard] = useState([]);
    const [editData, setEditData] = useState({
        topic: "",
        description: "",
        link: "",
        files: [],
        removedFiles: []
    });
    const [materialData, setMaterialData] = useState({ type: "link", link: "", files: [] });
    const [mode, setMode] = useState("view");
    const [materialKey, setMaterialKey] = useState(0);

    // --- password protection state (mandatory for every admin-added material) ---
    const [protectPassword, setProtectPassword] = useState("");
    const [unlockedIds, setUnlockedIds] = useState([]);
    const [unlockInputs, setUnlockInputs] = useState({});
    const [verifyingId, setVerifyingId] = useState(null);
    const [requestStatuses, setRequestStatuses] = useState({}); // itemId -> 'pending' | 'approved' | 'denied' | 'none'
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showRequests, setShowRequests] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:8000/get");
                console.log("GET DATA:", JSON.stringify(response.data, null, 2));
                setGetData(response.data);
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("materialData before submit:", materialData);

        if (!protectPassword) {
            toast.error("A password is required for every material");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("topic", data.topic);
            formData.append("description", data.description);
            formData.append("type", materialData.type);
            formData.append("link", materialData.link || "");
            formData.append("password", protectPassword);


            if (materialData.files?.length) {
                materialData.files.forEach(file => {
                    formData.append("files", file);
                });
            }
            console.log("link value:", materialData.link);
            console.log("link length:", materialData.link?.length);
            const response = await axios.post("http://localhost:8000/add", formData);
            console.log(response.data);
            setData({ topic: "", description: "", material: "" });
            setMaterialData({ type: "link", link: "", files: [] });
            setMaterialKey(prev => prev + 1);
            setProtectPassword("");
            toast.success("Data added successfully!");
        } catch (error) {
            console.log(error);
        }
    };

    const handleUpdate = async (id) => {
        try {
            const formData = new FormData();
            formData.append("topic", editData.topic);
            formData.append("description", editData.description);

            const item = getData.find((i) => i.id === id);

            if (item.type === "link") {
                formData.append("type", "link");
                formData.append("link", editData.link);
            } else {
                formData.append("type", "file");
                formData.append("removedFiles", JSON.stringify(editData.removedFiles));
                editData.files.forEach(file => {
                    formData.append("files", file);
                });
            }

            const response = await axios.put(`http://localhost:8000/update/${id}`, formData);
            console.log(response.data);

            setGetData((prevData) =>
                prevData.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            topic: editData.topic,
                            description: editData.description,
                            link: item.type === "link" ? editData.link : item.link,
                            files: item.type === "file"
                                ? [
                                    ...(item.files || []).filter(f => !editData.removedFiles.includes(f.fileName)), // ✅ fixed i -> item
                                    ...editData.files.map(f => ({ originalName: f.name, fileName: f.name }))
                                ]
                                : item.files, // ✅ fixed i -> item
                        }
                        : item
                )
            );
            setEditid(null);
        } catch (error) {
            console.log(error);
        }
    };

    const handleUnlock = async (id) => {
        const password = unlockInputs[id] || "";
        setVerifyingId(id);
        try {
            const response = await axios.post(`http://localhost:8000/verify/${id}`, { password });
            if (response.data.valid) {
                setUnlockedIds(prev => [...prev, id]);
                setUnlockInputs(prev => ({ ...prev, [id]: "" }));
                toast.success("Unlocked");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Incorrect password");
        }
        setVerifyingId(null);
    };

    const handleRequestAccess = async (id) => {
        if (!auth?.email) {
            toast.error("You must be logged in to request access");
            return;
        }
        try {
            const response = await axios.post(`http://localhost:8000/request-password/${id}`, { username: auth.email });
            setRequestStatuses(prev => ({ ...prev, [id]: response.data.status }));
            toast.success(response.data.status === "pending" ? "Access requested" : "Request already exists");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not send request");
        }
    };

    const checkRequestStatus = async (id) => {
        if (!auth?.email) return;
        try {
            const response = await axios.get(`http://localhost:8000/request-status/${id}`, {
                params: { username: auth.email }
            });
            setRequestStatuses(prev => ({ ...prev, [id]: response.data.status }));
            if (response.data.status === "approved") {
                setUnlockedIds(prev => prev.includes(id) ? prev : [...prev, id]);
                toast.success("Access approved — unlocked!");
            } else if (response.data.status === "denied") {
                toast.error("Your request was denied");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get("http://localhost:8000/password-requests");
            setPendingRequests(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            await axios.put(`http://localhost:8000/password-requests/${requestId}/approve`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            toast.success("Request approved");
        } catch (error) {
            toast.error("Could not approve request");
        }
    };

    const handleDenyRequest = async (requestId) => {
        try {
            await axios.put(`http://localhost:8000/password-requests/${requestId}/deny`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            toast.success("Request denied");
        } catch (error) {
            toast.error("Could not deny request");
        }
    };

    const handleLogout = () => {
        logout();
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split(".").pop().toLowerCase();
        switch (ext) {
            case "pdf":
                return (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 pl-2 pr-3 py-1.5">
                        <FaFilePdf size={14} className="shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{fileName}</span>
                    </div>
                );
            case "doc":
            case "docx":
                return (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 pl-2 pr-3 py-1.5">
                        <FaFileWord size={14} className="shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{fileName}</span>
                    </div>
                );
            case "ppt":
            case "pptx":
                return (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 pl-2 pr-3 py-1.5">
                        <FaFilePowerpoint size={14} className="shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{fileName}</span>
                    </div>
                );
            case "mp4":
            case "webm":
            case "mov":
                return (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 pl-2 pr-3 py-1.5">
                        <FaFileVideo size={14} className="shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{fileName}</span>
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 pl-2 pr-3 py-1.5">
                        <FaFileAlt size={14} className="shrink-0 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-300 truncate max-w-[160px]">{fileName}</span>
                    </div>
                );
        }
    };

    const handleMaterialChange = useCallback((val) => {
        setMaterialData(val);
    }, []);

    useEffect(() => {
        if (mode === "admin" && showRequests) {
            fetchPendingRequests();
        }
    }, [mode, showRequests]);

    useEffect(() => {
        async function loadAuth() {
            const auth = await checkAuth();
            setAuth(auth);
        }
        loadAuth();
    }, []);

    return (
        <>
            <ToastContainer />
            <div className="min-h-screen px-4 py-8 sm:py-10 flex justify-center bg-slate-50 dark:bg-slate-950">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-sm p-5 sm:p-8">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200 dark:border-slate-800">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Resource Library</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage shared materials, briefs, and links</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <DarkModeToggle />
                            <button
                                onClick={handleLogout}
                                title="Log out"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <FiLogOut size={15} /> Logout
                            </button>
                        </div>
                    </div>

                    {auth?.isAdmin && (
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            {/* Segmented view/admin toggle */}
                            <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 p-1">
                                <button
                                    onClick={() => {
                                        setShowUpdateIcon(true);
                                        setMode("admin");
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${mode === "admin"
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    <FiEdit size={14} /> Manage
                                </button>
                                <button
                                    onClick={() => {
                                        setMode("view");
                                        setIsShowInputs(false);
                                        setEditid(null);
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${mode === "view"
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    <FiEye size={14} /> View
                                </button>
                            </div>

                            {mode === "admin" && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowRequests(!showRequests)}
                                        className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2 rounded-full cursor-pointer transition-colors"
                                    >
                                        Access requests
                                        {pendingRequests.length > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setIsShowInputs(!showInputs)}
                                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-full cursor-pointer transition-colors shadow-sm"
                                    >
                                        <FiPlus size={16} /> Add material
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showRequests && mode === "admin" && (
                        <div className="mb-8 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Pending access requests</h2>
                            {pendingRequests.length === 0 ? (
                                <p className="text-sm text-slate-400 dark:text-slate-500">No pending requests.</p>
                            ) : (
                                <div className="space-y-2">
                                    {pendingRequests.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.username}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">requesting access to "{r.topic}"</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleApproveRequest(r.id)}
                                                    className="text-xs font-medium bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleDenyRequest(r.id)}
                                                    className="text-xs font-medium text-rose-500 hover:text-rose-600 cursor-pointer"
                                                >
                                                    Deny
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {showInputs && mode === "admin" && (
                        <div
                            className="mb-8 space-y-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                                    Topic
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                                    type="text" placeholder="e.g. Q3 Marketing Brief" name="topic"
                                    value={data.topic} onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                                    Description
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                                    type="text" placeholder="Short summary of this resource" name="description"
                                    value={data.description} onChange={handleChange}
                                />
                            </div>

                            <div>
                                <Materiel key={materialKey} onChange={handleMaterialChange} />
                            </div>

                            {/* Password protection — mandatory for every material */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                                    <FiLock size={12} /> Password (required)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Set a password for this material"
                                    value={protectPassword}
                                    onChange={(e) => setProtectPassword(e.target.value)}
                                    className="w-full sm:w-2/3 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                    Every material you add is protected — viewers must enter this password to access it.
                                </p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg cursor-pointer transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    )}

                    {/* List */}
                    <div className="space-y-4">
                        {getData.length === 0 && (
                            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                                No materials yet.
                            </div>
                        )}

                        {getData.map((item) => {
                            const isCollapsed = closeCard.includes(item.id);
                            const isEditing = editId === item.id;
                            const isLocked = item.protected && !unlockedIds.includes(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 hover:shadow-md dark:hover:shadow-none dark:hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isCollapsed) {
                                                        setCloseCard(closeCard.filter((id) => id !== item.id));
                                                    } else {
                                                        setCloseCard([...closeCard, item.id]);
                                                    }
                                                }}
                                                className="shrink-0 p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                                <FiChevronDown
                                                    size={18}
                                                    className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                                                />
                                            </button>

                                            {isEditing ? (
                                                <input
                                                    type="text" value={editData.topic}
                                                    onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                                                    className="min-w-0 flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-green-300 dark:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            ) : (
                                                <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                                                    {item.topic}
                                                    {item.protected && (
                                                        <FiLock size={13} className="text-slate-400 dark:text-slate-500 shrink-0" title="Password protected" />
                                                    )}
                                                </h3>
                                            )}
                                        </div>

                                        {mode === "admin" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditid(item.id);
                                                    setEditData({
                                                        topic: item.topic,
                                                        description: item.description,
                                                        link: item.link || item.fileName || "",
                                                        files: [],
                                                        removedFiles: []
                                                    });
                                                }}
                                                className="shrink-0 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                                <FiEdit size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {!isCollapsed && (
                                        <div className="mt-4 pl-8">
                                            {/* Description */}
                                            <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/70">
                                                <div className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center">
                                                    <MdStickyNote2 size={16} className="text-green-600 dark:text-green-400" />
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text" value={editData.description}
                                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-green-300 dark:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 pt-1.5">{item.description}</p>
                                                )}
                                            </div>

                                            {/* Locked state — verify password, or request access from admin */}
                                            {isLocked && !isEditing ? (
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <input
                                                            type="password"
                                                            placeholder="Enter password to view"
                                                            value={unlockInputs[item.id] || ""}
                                                            onChange={(e) => setUnlockInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            onKeyDown={(e) => e.key === "Enter" && handleUnlock(item.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnlock(item.id)}
                                                            disabled={verifyingId === item.id}
                                                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-full cursor-pointer transition-colors"
                                                        >
                                                            <FiUnlock size={14} />
                                                            {verifyingId === item.id ? "Checking..." : "Unlock"}
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">Don't have the password?</span>
                                                        {requestStatuses[item.id] === "pending" ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => checkRequestStatus(item.id)}
                                                                className="text-xs font-medium text-slate-500 dark:text-slate-400 underline cursor-pointer"
                                                            >
                                                                Request pending — check status
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRequestAccess(item.id)}
                                                                className="text-xs font-medium text-green-600 dark:text-green-400 underline cursor-pointer"
                                                            >
                                                                Request access
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Materials */
                                                <div className="flex flex-wrap items-start gap-2">
                                                    {isEditing ? (
                                                        item.type === "link" ? (
                                                            <input
                                                                type="text" value={editData.link}
                                                                onChange={(e) => setEditData({ ...editData, link: e.target.value })}
                                                                placeholder="https://"
                                                                className="w-full sm:w-2/3 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-green-300 dark:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full space-y-2">
                                                                {item.files?.map((f, i) => (
                                                                    <div key={i} className="flex items-center gap-2">
                                                                        <p className={`text-sm ${editData.removedFiles.includes(f.fileName) ? "line-through text-slate-300 dark:text-slate-600" : "text-slate-600 dark:text-slate-300"}`}>
                                                                            {f.originalName}
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (editData.removedFiles.includes(f.fileName)) {
                                                                                    setEditData({
                                                                                        ...editData,
                                                                                        removedFiles: editData.removedFiles.filter(name => name !== f.fileName)
                                                                                    });
                                                                                } else {
                                                                                    setEditData({
                                                                                        ...editData,
                                                                                        removedFiles: [...editData.removedFiles, f.fileName]
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="text-xs font-medium text-rose-500 hover:text-rose-600 cursor-pointer"
                                                                        >
                                                                            {editData.removedFiles.includes(f.fileName) ? "Undo" : "Remove"}
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {!item.files?.length && item.fileName && (
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.fileName}</p>
                                                                )}

                                                                <input
                                                                    type="file" multiple
                                                                    onChange={(e) => setEditData({ ...editData, files: Array.from(e.target.files) })}
                                                                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer cursor-pointer"
                                                                />
                                                            </div>
                                                        )
                                                    ) : (
                                                        <>
                                                            {(item.type === "link" || item.type === "both") && item.link && (
                                                                <a
                                                                    href={item.link} target="_blank" rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/60 pl-2 pr-3 py-1.5 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950 transition-colors"
                                                                >
                                                                    <FiLink size={14} className="shrink-0" />
                                                                    <span className="text-xs font-medium">Open link</span>
                                                                </a>
                                                            )}

                                                            {(item.type === "file" || item.type === "both") && item.files?.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {item.files.map((file, index) => (
                                                                        <a
                                                                            key={index}
                                                                            href={`http://localhost:8000/uploads/${file.fileName}`}
                                                                            download
                                                                            className="hover:opacity-90 transition-opacity"
                                                                        >
                                                                            {getFileIcon(file.fileName)}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {!item.files?.length && item.fileName && (
                                                                <a
                                                                    href={`http://localhost:8000/uploads/${item.fileName}`}
                                                                    download
                                                                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                                                >
                                                                    {item.fileName}
                                                                </a>
                                                            )}
                                                        </>
                                                    )}

                                                    {isEditing && (
                                                        <button
                                                            onClick={() => handleUpdate(item.id)}
                                                            className="mt-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-full cursor-pointer transition-colors"
                                                        >
                                                            Save changes
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default MainPagetext;