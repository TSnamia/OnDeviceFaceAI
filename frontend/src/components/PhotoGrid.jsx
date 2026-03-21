import { useState } from 'react'
import { Image as ImageIcon, Check, Star, Play } from 'lucide-react'

export default function PhotoGrid({ photos, selectionMode = false, selectedPhotos = [], onPhotoSelect }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const handlePhotoClick = (photo) => {
    if (selectionMode && onPhotoSelect) {
      onPhotoSelect(photo)
    } else {
      setSelectedPhoto(photo)
    }
  }

  const isSelected = (photo) => {
    return selectedPhotos.some(p => p.id === photo.id)
  }

  return (
    <>
      <div className="h-full overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
              className={`group aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all relative ${
                isSelected(photo) 
                  ? 'ring-4 ring-primary-500' 
                  : 'hover:ring-2 hover:ring-primary-500'
              }`}
            >
              {photo.file_path ? (
                <>
                  <img
                    src={`http://localhost:8000/${photo.file_path}`}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }}
                  />
                  {photo.is_video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Play className="w-12 h-12 text-white opacity-80" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              {selectionMode ? (
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  isSelected(photo) 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white bg-opacity-80 border-2 border-gray-300'
                }`}>
                  {isSelected(photo) && <Check className="w-4 h-4" />}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Toggle favorite
                    console.log('Toggle favorite:', photo.id)
                  }}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <Star className={`w-4 h-4 ${photo.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  )
}

function PhotoModal({ photo, onClose, onEdit }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="max-w-7xl max-h-full p-4">
        <img
          src={`http://localhost:8000/${photo.file_path}`}
          alt={photo.file_name}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="mt-2">Image not available</p></div>';
          }}
        />
      </div>
      
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit && onEdit(photo)
          }}
          className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
      </div>
      
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg max-w-sm">
        <h3 className="font-semibold mb-2">{photo.file_name}</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {photo.width && photo.height && (
            <p>{photo.width} × {photo.height}</p>
          )}
          {photo.taken_at && (
            <p>{new Date(photo.taken_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
