import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './Login'
import MainPage3 from './MainPage3'
import { AuthProvider } from './context/AuthContext'
import AddUser from './AddUser'
import ProtectedRoute from './ProtectedRoute'

const App = () => {
  // const { authUser } = useAuth();
  // const location = useLocation();

  // useEffect(() => {
  //   if (!authUser?.id) return;

  //   registerSocketEvents(socket, authUser, location);
  // }, [authUser?.id, location.pathname]);
  return (
    <AuthProvider >

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/main" element={<ProtectedRoute><MainPage3 /></ProtectedRoute>} />
          <Route path="/adduser" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </AuthProvider >
  )
}

export default App


// cursor-pointer