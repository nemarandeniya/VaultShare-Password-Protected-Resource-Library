import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext()

export const useAuthContext = () => {
    return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {

    const [authUser, setAuthUser] = useState(() => {
        const user = localStorage.getItem("user")
        if (user) {
            return JSON.parse(user)
        }
        return null
    })



    return (
        <AuthContext.Provider value={{ authUser, setAuthUser }}>
            {children}
        </AuthContext.Provider>
    )
}