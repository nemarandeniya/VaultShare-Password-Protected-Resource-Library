import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from "react-toastify";
import { useAuthContext } from "./context/AuthContext.jsx";

const Login = () => {

    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { authUser, setAuthUser } = useAuthContext()

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            const response = await axios.post('http://localhost:8000/login', { username, password })

            if (response.data.token) {

                setError("");

                toast.success("Successfully Login!");

                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                setAuthUser(response.data.user)

                console.log(response.data.user);
                console.log(authUser);

                navigate("/main");
            }
        } catch (error) {
            console.log(error);
            setError("Server Error.Please try again!")
        }
    }
    return (
        <div className="flex justify-center items-center bg-slate-50 min-h-screen px-4">

            <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 bg-white shadow-sm w-full max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                    <img src="/menu-logo.png" alt="Logo" className="h-12 w-auto" />
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-5">
                        <h4 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h4>
                        <p className="text-sm text-slate-500 mt-1 mb-5">Sign in to your account</p>

                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                            Username
                        </label>
                        <input
                            type='text'
                            className="w-full px-4 py-2.5 font-sans text-sm text-slate-900 border bg-white border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                            value={username}
                            placeholder='Enter username'
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                            Password
                        </label>
                        <input
                            type='password'
                            className="w-full px-4 py-2.5 text-sm text-slate-900 border bg-white border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                            value={password}
                            placeholder='Enter password'
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {/* <div className="flex justify-end mb-6">
                        <p className="text-sm text-slate-500">
                            <Link to="/forgot-password" className="text-green-600 hover:text-green-700 transition-colors">
                                Forgot password?
                            </Link>
                        </p>
                    </div> */}
                    <div className="mt-5">
                        <button
                            type='submit'
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:bg-green-700 active:scale-95 bg-green-600 cursor-pointer"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login