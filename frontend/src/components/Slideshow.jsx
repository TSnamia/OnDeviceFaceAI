import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

export default function Slideshow({ photos, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(true)
  const [interval, setIntervalDuration] = useState(3000) // 3 seconds

  const currentPhoto = photos[currentIndex]

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(goToNext, interval)
    return () => clearInterval(timer)
  }, [isPlaying, interval, goToNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, onClose])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="font-semibold">{currentPhoto.file_name}</h3>
            <p className="text-sm opacity-75">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={`http://localhost:8000/thumbnails/${currentPhoto.id}/preview.jpg`}
          alt={currentPhoto.file_name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.target.src = `http://localhost:8000/thumbnails/${currentPhoto.id}/thumbnail.jpg`
          }}
        />
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        <div className="flex items-center justify-center space-x-4 text-white">
          <button
            onClick={togglePlayPause}
            className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">Speed:</span>
            <select
              value={interval}
              onChange={(e) => setIntervalDuration(Number(e.target.value))}
              className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm"
            >
              <option value={1000}>Fast (1s)</option>
              <option value={3000}>Normal (3s)</option>
              <option value={5000}>Slow (5s)</option>
            </select>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="mt-4 flex items-center justify-center space-x-2 overflow-x-auto scrollbar-thin pb-2">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all ${
                idx === currentIndex ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={`http://localhost:8000/thumbnails/${photo.id}/thumbnail.jpg`}
                alt={photo.file_name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
