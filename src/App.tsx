import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import WorkspacePage from './pages/WorkspacePage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/workspace/:storeName" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  )
}
