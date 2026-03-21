import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Image, 
  Users, 
  FolderHeart, 
  Calendar, 
  Tag,
  Sparkles,
  Download,
  LayoutDashboard,
  MapPin,
  Star,
  Smile,
  HardDrive,
  Settings
} from 'lucide-react'

export default function Sidebar() {
  const { t } = useTranslation()
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { path: '/gallery', icon: Image, label: t('navigation.gallery') },
    { path: '/people', icon: Users, label: t('navigation.people') },
    { path: '/albums', icon: FolderHeart, label: t('navigation.import') },
    { path: '/map', icon: MapPin, label: t('common.search') },
    { path: '/processing', icon: HardDrive, label: t('common.search') },
    { path: '/settings', icon: Settings, label: t('navigation.settings') },
  ]

  const smartAlbums = [
    { id: 'family', label: t('dashboard.title'), icon: Users },
    { id: 'vacation', label: t('dashboard.title'), icon: Calendar },
    { id: 'pets', label: t('dashboard.title'), icon: Sparkles },
    { id: 'events', label: t('dashboard.title'), icon: Calendar },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t('dashboard.title')}
          </h3>
          <div className="space-y-1">
            {smartAlbums.map((album) => (
              <button
                key={album.id}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <album.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{album.label}</span>
                </div>
                <span className="text-xs text-gray-400">0</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t('search.filters')}
          </h3>
          <div className="space-y-1">
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Tag className="w-4 h-4" />
                <span className="text-sm">{t('gallery.title')}</span>
              </div>
              <span className="text-xs text-gray-400">★</span>
            </NavLink>
            
            <NavLink
              to="/albums/private"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <FolderHeart className="w-4 h-4" />
                <span className="text-sm">{t('navigation.private')}</span>
              </div>
              <span className="text-xs text-gray-400">🔒</span>
            </NavLink>
            
            <NavLink
              to="/quality"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">{t('gallery.title')}</span>
              </div>
              <span className="text-xs text-gray-400">✨</span>
            </NavLink>
            
            <NavLink
              to="/expressions"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Smile className="w-4 h-4" />
                <span className="text-sm">{t('people.title')}</span>
              </div>
              <span className="text-xs text-gray-400">😊</span>
            </NavLink>
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full btn btn-secondary flex items-center justify-center space-x-2">
          <Download className="w-4 h-4" />
          <span>{t('common.download')}</span>
        </button>
      </div>
    </aside>
  )
}
