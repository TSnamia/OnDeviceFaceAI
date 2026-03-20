import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Gallery from './pages/Gallery'
import People from './pages/People'
import PersonProfile from './pages/PersonProfile'
import Albums from './pages/Albums'
import Map from './pages/Map'
import Favorites from './pages/Favorites'
import Search from './pages/Search'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:personId" element={<PersonProfile />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/map" element={<Map />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
