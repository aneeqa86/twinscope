import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import MainLayout from '@/components/layout/MainLayout'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import NotFoundPage from '@/pages/NotFoundPage'

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* HomePage is full screen — no Navbar/Footer wrapper */}
          <Route path="/" element={<HomePage />} />

          {/* Other pages keep the layout */}
          <Route element={<MainLayout />}>
            <Route path="/about" element={<AboutPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App