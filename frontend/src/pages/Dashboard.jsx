import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BarChart3, Users, Image, Calendar, TrendingUp, Clock, Upload, Play, Sparkles, HardDrive, AlertTriangle } from 'lucide-react'
import { fetchPhotos, fetchPeople } from '../services/api'
import UploadModal from '../components/UploadModal'

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false)

  const { data: photosData = {}, isLoading: photosLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchPhotos(0, 10000),
  })
  
  const { data: people = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  const photos = photosData.photos || []
  const isLoading = photosLoading || peopleLoading
  const navigate = useNavigate()
  
  // Calculate statistics
  const stats = {
    totalPhotos: photos.length,
    totalPeople: people.length,
    processedPhotos: photos.filter(p => p.processed).length,
    totalFaces: people.reduce((sum, p) => sum + p.face_count, 0),
  }
  
  // Storage statistics
  const totalSize = photos.reduce((sum, p) => sum + (p.file_size || 0), 0)
  const avgSize = totalSize / photos.length || 0
  const storageMB = (totalSize / (1024 * 1024)).toFixed(2)
  const storageGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2)
  
  // Quality statistics
  const highQuality = photos.filter(p => p.quality_score >= 0.6).length
  const lowQuality = photos.filter(p => p.quality_score < 0.4 && p.quality_score !== null).length
  const qualityRate = photos.length > 0 ? Math.round((highQuality / photos.length) * 100) : 0
  
  // Photos by month
  const photosByMonth = photos.reduce((acc, photo) => {
    if (!photo.taken_at) return acc
    const month = new Date(photo.taken_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})
  
  const recentMonths = Object.entries(photosByMonth)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-6)
  
  // Top people
  const topPeople = [...people]
    .sort((a, b) => b.face_count - a.face_count)
    .slice(0, 5)
  
  // Recent photos
  const recentPhotos = [...photos]
    .sort((a, b) => new Date(b.imported_at) - new Date(a.imported_at))
    .slice(0, 6)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your photo library</p>
        </div>
        
        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400 mb-2" />
              <span className="text-sm font-medium">Upload</span>
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Image className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="text-sm font-medium">Gallery</span>
            </button>
            <button
              onClick={() => navigate('/people')}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Users className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <span className="text-sm font-medium">People</span>
            </button>
            <button
              onClick={() => navigate('/quality')}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="text-sm font-medium">Quality</span>
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Image className="w-6 h-6" />}
            title="Total Photos"
            value={stats.totalPhotos}
            subtitle={`${stats.processedPhotos} processed`}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="People"
            value={stats.totalPeople}
            subtitle={`${stats.totalFaces} faces detected`}
            color="green"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="This Month"
            value={photosByMonth[Object.keys(photosByMonth).slice(-1)[0]] || 0}
            subtitle="Photos added"
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Processing"
            value={`${Math.round((stats.processedPhotos / stats.totalPhotos) * 100)}%`}
            subtitle="Complete"
            color="orange"
          />
        </div>
        
        {/* Storage & Quality Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Storage Usage */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <HardDrive className="w-5 h-5" />
              <span>Storage Usage</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Size</span>
                  <span className="text-2xl font-bold">{storageGB > 1 ? `${storageGB} GB` : `${storageMB} MB`}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                    style={{ width: `${Math.min((totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">10 GB available</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Photo Size</p>
                  <p className="text-lg font-semibold">{(avgSize / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Files</p>
                  <p className="text-lg font-semibold">{stats.totalPhotos}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quality Overview */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Quality Overview</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quality Rate</span>
                  <span className="text-2xl font-bold">{qualityRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                    style={{ width: `${qualityRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">High quality photos</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">High Quality</p>
                    <p className="text-lg font-semibold">{highQuality}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Low Quality</p>
                    <p className="text-lg font-semibold">{lowQuality}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photos by Month */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Photos by Month</span>
            </h3>
            <div className="space-y-3">
              {recentMonths.map(([month, count]) => (
                <div key={month} className="flex items-center space-x-3">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{month}</div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-primary-500 h-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                      style={{ width: `${(count / Math.max(...recentMonths.map(m => m[1]))) * 100}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Top People */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Top People</span>
            </h3>
            <div className="space-y-3">
              {topPeople.map((person) => (
                <div key={person.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-sm text-gray-500">{person.face_count} photos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Photos */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recently Added</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentPhotos.map((photo) => (
              <div key={photo.id} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={`http://localhost:8000/thumbnails/${photo.id}/thumbnail.jpg`}
                  alt={photo.file_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
    </div>
  )
}

function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
