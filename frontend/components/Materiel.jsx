import React, { useState, useRef, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import { FiLink, FiFile, FiPaperclip, FiX } from "react-icons/fi";
const Material = ({ onChange }) => {

    const [activeTab, setActiveTab] = useState("link");
    const [files, setFiles] = useState([]);
    const [link, setLink] = useState("");
    const [previewUrls, setPreviewUrls] = useState({});  // index -> url

    const fileInputRef = useRef(null);

    const handleDragOver = (e) => e.preventDefault();
    const handleDragLeave = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    };

    const handleFileChange = (e) => {
        setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const removeFile = (index) => {
        // revoke the url if it's a video
        if (previewUrls[index]) {
            URL.revokeObjectURL(previewUrls[index]);
            setPreviewUrls(prev => {
                const updated = { ...prev };
                delete updated[index];
                return updated;
            });
        }
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // generate preview URLs for videos
    useEffect(() => {
        const newUrls = {};
        files.forEach((file, index) => {
            const isVideo = file.type?.startsWith("video") || /\.(mp4|webm|mov)$/i.test(file.name);
            if (isVideo) {
                newUrls[index] = URL.createObjectURL(file);
            }
        });
        setPreviewUrls(newUrls);

        // cleanup on unmount or files change
        return () => {
            Object.values(newUrls).forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    useEffect(() => {
        onChange({
            type: activeTab,
            link: activeTab === "link" || activeTab === "both" ? link : null,
            files: activeTab === "file" || activeTab === "both" ? files : [],
        });
    }, [activeTab, link, files, onChange]);

    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Add material
            </label>

            {/* Tabs */}
            <div className="inline-flex gap-1 p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60">
                <button
                    type="button"
                    onClick={() => setActiveTab("link")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === "link"
                            ? "bg-green-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                >
                    <FiLink size={14} /> Link
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("file")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === "file"
                            ? "bg-green-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                >
                    <FiFile size={14} /> File
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("both")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeTab === "both"
                            ? "bg-green-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                >
                    <FiPaperclip size={14} /> Both
                </button>
            </div>

            {/* LINK */}
            {(activeTab === "link" || activeTab === "both") && (
                <div className="mt-4">
                    <input
                        type="url"
                        placeholder="https://example.com/link"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                    />
                </div>
            )}

            {/* FILE */}
            {(activeTab === "file" || activeTab === "both") && (
                <div className="mt-4">

                    {/* Drop area */}
                    <label
                        htmlFor="file-upload"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center cursor-pointer block hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors text-slate-500 dark:text-slate-400 text-sm"
                    >
                        Drop files here or <span className="text-green-600 dark:text-green-400 font-medium underline ms-1">browse</span>
                    </label>

                    <input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        multiple
                        className="hidden"
                        accept="video/mp4,video/webm,video/quicktime,video/*,.pdf,.doc,.ppt,.pptx"
                        onChange={handleFileChange}
                    />

                    {/* PREVIEW */}
                    {files.map((file, index) => {
                        const isVideo = file.type?.startsWith("video") || /\.(mp4|webm|mov)$/i.test(file.name);

                        return (
                            <div key={index} className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                                {isVideo ? (
                                    <div className="space-y-2">
                                        {previewUrls[index] && (
                                            <video
                                                src={previewUrls[index]}
                                                controls
                                                className="w-full rounded-md"
                                            />
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="truncate flex-1 text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
                                            <span className="mx-3 text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <FaFilePdf className="text-xl text-green-600 dark:text-green-400 shrink-0" />
                                        <span className="truncate flex-1 text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </div>
            )}


        </div>
    );
};

export default Material;