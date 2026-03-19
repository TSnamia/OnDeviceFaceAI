import { Moon, Sun, Users, Search, Upload } from 'lucide-react'
import { useState } from 'react'
import UploadModal from './UploadModal'

export default function Header({ darkMode, setDarkMode, showFacePanel, setShowFacePanel }) {
  const [showUploadModal, setShowUploadModal] = useState(false)

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            OnDeviceFaceAI
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Intelligent Photo Archive
          </span>
        </div>
        
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos, people, events..."
              className="w-full pl-10 pr-4 py-2 input"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          
          <button
            onClick={() => setShowFacePanel(!showFacePanel)}
            className={`btn ${showFacePanel ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Users className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn btn-ghost"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>
      
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </>
  )
}
