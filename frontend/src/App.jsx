import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout'
import ModernHeader from './components/ModernHeader'
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
import ExpressionFilter from './pages/ExpressionFilter'
import Search from './pages/Search'
import Processing from './pages/Processing'
import Settings from './pages/Settings'

function App() {
  const { t } = useTranslation()

  return (
    <Router>
      <ModernHeader />
      <Layout>
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
          <Route path="/expressions" element={<ExpressionFilter />} />
          <Route path="/search" element={<Search />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
