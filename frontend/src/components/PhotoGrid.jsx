import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

export default function PhotoGrid({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  return (
    <>
      <div className="h-full overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
            >
              {photo.thumbnail_path ? (
                <img
                  src={photo.thumbnail_path}
                  alt={photo.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
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

function PhotoModal({ photo, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="max-w-7xl max-h-full p-4">
        <img
          src={photo.preview_path || photo.file_path}
          alt={photo.file_name}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
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
