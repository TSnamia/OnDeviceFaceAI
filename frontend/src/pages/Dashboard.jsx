import { useQuery } from '@tanstack/react-query'
import { BarChart3, Users, Image, Calendar, TrendingUp, Clock } from 'lucide-react'
import { fetchPhotos, fetchPeople } from '../services/api'

export default function Dashboard() {
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
  
  // Calculate statistics
  const stats = {
    totalPhotos: photos.length,
    totalPeople: people.length,
    processedPhotos: photos.filter(p => p.processed).length,
    totalFaces: people.reduce((sum, p) => sum + p.face_count, 0),
  }
  
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
