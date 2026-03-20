import { Moon, Sun, Users, Search, Upload } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPeople, fetchPhotos } from '../services/api'
import UploadModal from './UploadModal'

export default function Header({ darkMode, setDarkMode, showFacePanel, setShowFacePanel }) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  
  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  const { data: allPhotos = {} } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchPhotos(),
  })
  
  // Filter suggestions based on search query
  const suggestions = searchQuery.trim() ? [
    ...people
      .filter(person => person.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(person => ({ type: 'person', name: person.name, count: person.face_count })),
    ...(allPhotos.photos || [])
      .filter(photo => photo.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(photo => ({ type: 'photo', name: photo.file_name }))
  ].slice(0, 8) : []
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        
        <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (searchQuery.trim()) {
              navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
              setShowSuggestions(false)
            }
          }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search photos, people, events..."
                className="w-full pl-10 pr-4 py-2 input"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSearchQuery(suggestion.name)
                        navigate(`/search?q=${encodeURIComponent(suggestion.name)}`)
                        setShowSuggestions(false)
                      }}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {suggestion.type === 'person' ? (
                          <Users className="w-4 h-4 text-primary-500" />
                        ) : (
                          <Search className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm">{suggestion.name}</span>
                      </div>
                      {suggestion.count && (
                        <span className="text-xs text-gray-500">{suggestion.count} photos</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
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
