import { React, useState, useEffect } from 'react'
import { FaUserPlus, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const AddUser = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async () => {
        setError("")
        if (!form.username || !form.password) {
            setError("Please fill all the fields")
            return;
        }
        setLoading(true)
        try {
            const response = await axios.post("http://localhost:8000/register", form, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            console.log(response.data)
            setForm({
                username: "",
                password: "",
            })
            toast.success("User added successfully")
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.message)
        }
        setLoading(false)
    }

    return (
        <div className='min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950'>
            <div className="w-full max-w-md pt-16 px-4 py-12 mt-1">
                {/* card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-sm">
                    {/* card header */}
                    <div className="px-8 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-1">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg
               bg-slate-200 dark:bg-slate-800
               text-slate-700 dark:text-white
               hover:bg-slate-300 dark:hover:bg-slate-700
               transition cursor-pointer"
                            >
                                <FaArrowLeft className="text-sm" />
                            </button>
                            <div className="bg-green-600 text-white w-9 h-9 rounded-xl flex items-center justify-center">
                                <FaUserPlus className='text-sm' />
                            </div>
                            <h2 className='text-slate-900 dark:text-white text-lg font-semibold tracking-tight'>Add New User</h2>
                        </div>
                        <p className='text-slate-500 dark:text-slate-400 text-xs ms-12'>Fill in the details to create a new account</p>
                    </div>

                    {/* form */}
                    <div className="px-8 py-6 flex flex-col gap-5">

                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest'>
                                Username
                            </label>
                            <input
                                type="text"
                                name='username'
                                placeholder='Eg. John Doe'
                                value={form.username}
                                onChange={handleChange}
                                className='w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-white/30 outline-none transition-all duration-200 focus:ring-2 focus:ring-green-500'

                            />
                        </div>
                        {/* email */}
                        {/* <div className="flex flex-col gap-1.5">
                            <label className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest'>
                                Email
                            </label>
                            <input
                                type="email"
                                name='email'
                                placeholder='Eg. user@example.com'
                                value={form.email}
                                onChange={handleChange}
                                className='w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-white/30 outline-none transition-all duration-200 focus:ring-2 focus:ring-green-500'
                            />
                        </div> */}
                        {/* password */}
                        <div className="flex flex-col gap-1.5">
                            <label className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest'>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name='password'
                                    placeholder='Eg. ***************'
                                    value={form.password}
                                    onChange={handleChange}
                                    className='w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-white/30 outline-none transition-all duration-200 focus:ring-2 focus:ring-green-500'

                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white/70 transition-colors cursor-pointer'>
                                    {showPassword ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
                                </button>
                            </div>
                        </div>


                        {error && (
                            <p className="text-sm text-rose-500 -mt-2">{error}</p>
                        )}

                        {/* button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className='w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-1 bg-green-600 cursor-pointer'
                        >
                            {loading ? (
                                <>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FaUserPlus />
                                    Add New User
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default AddUser