import { FiPlus, FiEdit, FiChevronDown, FiEye, FiLink } from "react-icons/fi";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileVideo, FaFileAlt } from "react-icons/fa";
import { MdStickyNote2 } from "react-icons/md";
import { useState, useEffect, useCallback } from "react";
import { checkAuth } from "./auth.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Materiel from "../components/Materiel.jsx";
import DarkModeToggle from "../components/DarkModeToggle.jsx";


function App() {

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
    try {
      const formData = new FormData();
      formData.append("topic", data.topic);
      formData.append("description", data.description);
      formData.append("type", materialData.type);
      formData.append("link", materialData.link || "");


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

  const getFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf":
        return (<div className="border border-[#9FD2CD] bg-[#9fd2cd] dark:border-[#3bb9af]  dark:bg-[#457a76] rounded-full p-2 flex items-center gap-2 justify-center">
          <FaFilePdf size={18} color={"#ffffff"} className="mt-1 shrink-0"></FaFilePdf>
          {fileName}
        </div>)
      case "doc":
      case "docx":
        return (<div className="border border-[#9FD2CD] bg-[#9fd2cd] dark:border-[#3bb9af]  dark:bg-[#333c3b]  text-gray-400 hover:text-[#457a76] rounded-full p-2 gap-2 flex items-center justify-center">
          <FaFileWord size={18} color={"#ffffff"} className="mt-1 shrink-0" ></FaFileWord>
          {fileName}
        </div>)
      case "ppt":
      case "pptx":
        return (<div className="border border-[#9FD2CD] bg-[#9fd2cd] dark:border-[#3bb9af]  dark:bg-[#457a76] text-gray-400 rounded-full p-2 flex items-center justify-center gap-2">
          <FaFilePowerpoint size={18} color={"#ffffff"} className="mt-1 shrink-0"></FaFilePowerpoint>{fileName}</div>)
      case "mp4":
      case "webm":
      case "mov":
        return (<div className="border border-[#9FD2CD] bg-[#9fd2cd] dark:border-[#3bb9af]  dark:bg-[#457a76] rounded-full p-2 gap-2 flex items-center justify-center">
          <FaFileVideo size={18} color={"#ffffff"} className="mt-1 shrink-0"></FaFileVideo>
          {fileName}
        </div>)
      default:
        return <FaFileAlt size={18} color={"#9FD2CD"} className="mt-1 shrink-0"></FaFileAlt>
        { fileName }
    }
  };

  const handleMaterialChange = useCallback((val) => {
    setMaterialData(val);
  }, []);

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
      <div className="min-h-screen px-4 py-6 bg-gradient-to-r flex justify-center from-[#eafaf2] to-[#f1fae1] dark:from-[#0f1117] dark:to-[#0f1117]">
        <div className="bg-white dark:bg-[#1a1d27] border dark:border-white/7 w-full max-w-4xl rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex justify-end mb-4">
            <DarkModeToggle />
          </div>
          {auth?.isAdmin && (
            <>
              <div className="flex gap-2 justify-center">
                <button
                  className="bg-[#3bb961] dark:bg-[#1a1d27] gap-2 text-white dark:text-white border dark:border-white/10 hover:scale-110 px-4 py-2 rounded-md cursor-pointer mt-7 me-2 w-26 flex justify-center items-center"
                  onClick={() => {
                    setShowUpdateIcon(true);
                    setMode("admin");
                  }}
                >
                  <FiEdit /> Update
                </button>
                <button
                  className="bg-[#acb93b] dark:bg-[#1a1d27] gap-2 text-white dark:text-white border dark:border-white/10 hover:scale-110 px-4 py-2 rounded-md cursor-pointer mt-7 w-26 flex justify-center items-center"
                  onClick={() => {
                    setMode("view");
                    setIsShowInputs(false);
                    setEditid(null);
                  }}
                >
                  <FiEye /> View
                </button>
              </div>

              {mode === "admin" && (
                <button
                  onClick={() => setIsShowInputs(!showInputs)}
                  className="bg-[#3bb9af]  dark:bg-[#1a1d27] text-white dark:text-white border dark:border-white/10 hover:scale-110 ms-4 flex justify-center items-center text-white px-4 py-2 rounded-md cursor-pointer mt-7"
                >
                  <FiPlus />
                </button>
              )}
            </>
          )}

          {showInputs && mode === "admin" && (
            <div className="mt-10 space-y-4 border border-[#9fd2cd] rounded-md p-3" onClick={(e) => e.stopPropagation()}>
              <input
                className="px-4 py-2 rounded-md cursor-pointer mb-5 bg-white dark:bg-[#13151e] text-black dark:text-white  lg:w-5/12 sm:w-full w-full focus:outline-none focus:ring-2 border border-[#9fd2cd] focus:ring-[#9fd2cd]"
                type="text" placeholder="Topic" name="topic"
                value={data.topic} onChange={handleChange}
              /><br />
              <input
                className="px-4 py-2 rounded-md cursor-pointer mb-5 bg-white dark:bg-[#13151e] text-black dark:text-white lg:w-5/12 sm:w-full w-full focus:outline-none focus:ring-2 border border-[#9fd2cd] focus:ring-[#9fd2cd]"
                type="text" placeholder="Description" name="description"
                value={data.description} onChange={handleChange}
              /><br />
              <Materiel key={materialKey} onChange={handleMaterialChange} />
              <br />
              <button
                onClick={handleSubmit}
                className="bg-[#3bb9af] lg:w-5/12 sm:w-full w-full flex justify-center items-center text-white px-4 py-2 rounded-md cursor-pointer mt-2"
              >
                Submit
              </button>
            </div>
          )}

          <div className="mt-10">
            {getData.map((item) => (
              <div key={item.id} className="border border-gray-300 rounded-md p-3 ms-4 me-4 h-auto mb-8">
                <div>
                  <div className="flex items-center justify-between">

                    <div className="flex items-center">
                      <FiChevronDown
                        onClick={() => {
                          if (closeCard.includes(item.id)) {
                            setCloseCard(closeCard.filter((id) => id !== item.id));
                          } else {
                            setCloseCard([...closeCard, item.id]);
                          }
                        }}
                        className={`me-2 mb-2 dark:text-white cursor-pointer hover:scale-150 transition-transform ${closeCard.includes(item.id) ? "rotate-180" : ""}`}
                      />

                      {editId === item.id ? (
                        <input
                          type="text" value={editData.topic}
                          onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                          className="px-4 py-2 rounded-md cursor-pointer mb-3 bg-white w-5/12 focus:outline-none focus:ring-2 border border-[#9fd2cd] focus:ring-[#9fd2cd] me-5"
                        />
                      ) : (
                        <h3 className="text-lg dark:text-white  font-semibold me-2 mb-3">{item.topic}</h3>
                      )}
                    </div>


                    {/* edit btn */}
                    {mode === "admin" && (
                      <FiEdit
                        className="cursor-pointer dark:text-white  hover:scale-110 transition-transform"
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
                      />
                    )}
                  </div>


                  {!closeCard.includes(item.id) && (
                    <>
                      <div className="border-b-gray-300 w-180px h-auto border-b flex items-center mt-4">
                        <div className="flex items-start">
                          <div className="border border-[#9FD2CD] bg-[#9fd2cd] dark:border-[#3bb9af]  dark:bg-[#457a76] rounded-full p-2 flex items-center justify-center ms-2 mb-2">
                            <MdStickyNote2 size={18} color={"#ffffff"} />
                          </div>
                          {editId === item.id ? (
                            <input
                              type="text" value={editData.description}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              className="px-4 py-2 rounded-md cursor-pointer mb-5 bg-white w-5/12 focus:outline-none focus:ring-2 border border-[#9fd2cd] focus:ring-[#9fd2cd]"
                            />
                          ) : (
                            <h2 className="text-sm ms-5 text-gray-600 font-semibold dark:text-gray-300 me-1 mb-5">{item.description}</h2>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start mt-4 mb-5 me-2 gap-2">

                        {editId === item.id ? (
                          item.type === "link" ? (
                            // link edit
                            <input
                              type="text" value={editData.link}
                              onChange={(e) => setEditData({ ...editData, link: e.target.value })}
                              className="px-4 py-2 rounded-md cursor-pointer mb-5 bg-white w-5/12 focus:outline-none focus:ring-2 border border-[#9fd2cd] focus:ring-[#9fd2cd]"
                            />
                          ) : (
                            // file edit
                            <div className="ms-2">
                              {/* existing files with remove button */}
                              {item.files?.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 mb-1">
                                  <p className={`text-sm ${editData.removedFiles.includes(f.fileName) ? "line-through text-gray-300" : "text-gray-500"}`}>
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
                                    className="text-xs text-red-400"
                                  >
                                    {editData.removedFiles.includes(f.fileName) ? "undo" : "✕"}
                                  </button>
                                </div>
                              ))}
                              {/* fallback for old single file records */}
                              {!item.files?.length && item.fileName && (
                                <p className="text-sm text-gray-500 mb-2">{item.fileName}</p>
                              )}
                              {/* add new files */}
                              <input
                                type="file" multiple className="mt-2 text-sm"
                                onChange={(e) => setEditData({ ...editData, files: Array.from(e.target.files) })}
                              />
                            </div>
                          )
                        ) : (
                          // view mode
                          <div className="flex gap-3 text-sm ms-2 text-gray-600 me-2">
                            {/* Link */}
                            {(item.type === "link" || item.type === "both") && item.link && (
                              <a href={item.link} target="_blank" rel="noreferrer" className="text-blue-400 dark:text-white">
                                <div className="flex items-center gap-3 mb-1">
                                  <div className="border border-[#9FD2CD] bg-[#9fd2cd]  dark:border-[#3bb9af]  dark:bg-[#457a76] rounded-full p-2 flex items-center justify-center gap-2">
                                    <FiLink size={18} color={"#ffffff"} className="mt-1 shrink-0" />
                                    Open Link
                                  </div>
                                </div>
                              </a>
                            )}

                            {/* Files */}
                            {(item.type === "file" || item.type === "both") && item.files?.length > 0 && (
                              <div className="flex flex-col gap-1">
                                {item.files.map((file, index) => (
                                  <a
                                    key={index}
                                    href={`http://localhost:8000/uploads/${file.fileName}`}
                                    download
                                    className="text-blue-400 dark:text-white flex items-center gap-2"
                                  >
                                    {getFileIcon(file.fileName)}

                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Fallback for old single-file records only */}
                            {!item.files?.length && item.fileName && (
                              <a href={`http://localhost:8000/uploads/${item.fileName}`} download className="text-blue-400 underline">
                                {item.fileName}
                              </a>
                            )}
                          </div>
                        )}

                        {editId === item.id && (
                          <button
                            onClick={() => handleUpdate(item.id)}
                            className="bg-[#3bb9af] text-white px-2 py-1 rounded-md cursor-pointer mb-3 ms-3"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div >

        </div >
      </div >
    </>
  );
}

export default App;