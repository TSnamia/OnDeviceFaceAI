import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Gallery from './pages/Gallery'
import People from './pages/People'
import PersonProfile from './pages/PersonProfile'
import Albums from './pages/Albums'
import PrivateAlbums from './pages/PrivateAlbums'
import Map from './pages/Map'
import Favorites from './pages/Favorites'
import SimilarPhotos from './pages/SimilarPhotos'
import QualityFilter from './pages/QualityFilter'
import Search from './pages/Search'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const authStatus = localStorage.getItem('is_authenticated')
    setIsAuthenticated(authStatus === 'true')
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('is_authenticated')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/people" element={<People />} />
            <Route path="/people/:personId" element={<PersonProfile />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/albums/private" element={<PrivateAlbums />} />
            <Route path="/map" element={<Map />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/similar" element={<SimilarPhotos />} />
            <Route path="/quality" element={<QualityFilter />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  )
}

export default App
