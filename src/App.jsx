import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import NotFoundPage from '@/pages/NotFoundPage'

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Full-screen map */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
