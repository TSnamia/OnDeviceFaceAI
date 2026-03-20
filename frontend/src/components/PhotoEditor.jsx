import { useState } from 'react'
import { X, RotateCw, Crop, Sun, Contrast, Save } from 'lucide-react'

export default function PhotoEditor({ photo, onClose, onSave }) {
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement save API
      await onSave({
        photoId: photo.id,
        rotation,
        brightness,
        contrast
      })
      onClose()
    } catch (error) {
      console.error('Error saving edits:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setRotation(0)
    setBrightness(100)
    setContrast(100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <h2 className="text-white text-lg font-semibold">Edit Photo</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          <img
            src={`http://localhost:8000/thumbnails/${photo.id}/preview.jpg`}
            alt={photo.file_name}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`
            }}
          />
        </div>

        {/* Controls */}
        <div className="w-80 bg-gray-900 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Rotation */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium flex items-center space-x-2">
                  <RotateCw className="w-4 h-4" />
                  <span>Rotation</span>
                </label>
                <span className="text-gray-400 text-sm">{rotation}°</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setRotation((rotation - 90 + 360) % 360)}
                  className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  -90°
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  +90°
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full mt-3"
              />
            </div>

            {/* Brightness */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium flex items-center space-x-2">
                  <Sun className="w-4 h-4" />
                  <span>Brightness</span>
                </label>
                <span className="text-gray-400 text-sm">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium flex items-center space-x-2">
                  <Contrast className="w-4 h-4" />
                  <span>Contrast</span>
                </label>
                <span className="text-gray-400 text-sm">{contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Info */}
            <div className="pt-4 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Adjust the settings above to edit your photo. Click Save to apply changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
