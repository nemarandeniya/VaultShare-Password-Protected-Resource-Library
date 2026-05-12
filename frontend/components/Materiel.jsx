import React, { useState, useRef, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import { FiLink, FiFile, FiPaperclip } from "react-icons/fi";
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
            <label className="ms-3">Add Material</label>

            {/* Tabs */}
            <div className="flex gap-3 mt-2 lg:w-5/12 sm:w-full">
                <button
                    type="button"
                    onClick={() => setActiveTab("link")}
                    className={`flex items-center gap-2 p-[10px] rounded-[8px] ${activeTab === "link" ? "bg-[#9fd2cd]" : "bg-[#e3dfdf]"}`}
                >
                    <FiLink size={20} className={`${activeTab === "link" ? "text-gray-900" : "text-[#9FD2CD]"}`} /> Link
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("file")}
                    className={`flex items-center gap-2 p-[10px] rounded-[8px] ${activeTab === "file" ? "bg-[#9fd2cd]" : "bg-[#e3dfdf]"}`}
                >
                    <FiFile size={20} className={`${activeTab === "file" ? "text-gray-900" : "text-[#9FD2CD]"}`} /> File
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("both")}
                    className={`flex items-center gap-2 p-[10px] rounded-[8px] ${activeTab === "both" ? "bg-[#9fd2cd]" : "bg-[#e3dfdf]"}`}
                >
                    <FiPaperclip size={20} className={`${activeTab === "both" ? "text-gray-900" : "text-[#9FD2CD]"}`} /> Both
                </button>
            </div>

            {/* LINK */}
            {(activeTab === "link" || activeTab === "both") && (
                <div className="mt-4 lg:w-5/12 sm:w-full">
                    <input
                        type="url"
                        placeholder="https://example.com/link"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="px-4 py-2 rounded-md bg-white w-full border border-[#9fd2cd]"
                    />
                </div>
            )}

            {/* FILE */}
            {(activeTab === "file" || activeTab === "both") && (
                <div className="lg:w-5/12 mt-4">

                    {/* Drop area */}
                    <label
                        htmlFor="file-upload"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-[#9fd2cd] rounded-xl p-10 text-center cursor-pointer block hover:border-[#3bb9af] hover:bg-[#f0fdfa] transition text-[#9fd2cd] text-sm"
                    >
                        Drop files here or <span className="text-gray-700 underline ms-1">browse</span>
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
                            <div key={index} className="mt-3 p-3 bg-gray-50 rounded-xl">
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
                                            <span className="truncate flex-1">{file.name}</span>
                                            <span className="mx-3">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                            <button type="button" onClick={() => removeFile(index)} className="text-gray-500">✕</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <FaFilePdf className="text-xl" />
                                        <span className="truncate flex-1">{file.name}</span>
                                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                                        <button type="button" onClick={() => removeFile(index)} className="text-gray-500">✕</button>
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