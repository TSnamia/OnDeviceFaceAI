import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin, Image as ImageIcon } from 'lucide-react'
import { fetchPhotos } from '../services/api'
import { useState } from 'react'

export default function Map() {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchPhotos(0, 10000),
  })
  
  const photos = data?.photos || []
  
  // Filter photos with GPS data
  const photosWithLocation = photos.filter(
    photo => photo.latitude && photo.longitude
  )
  
  // Group photos by location (approximate)
  const locationGroups = photosWithLocation.reduce((acc, photo) => {
    const key = `${photo.latitude.toFixed(3)},${photo.longitude.toFixed(3)}`
    if (!acc[key]) {
      acc[key] = {
        lat: photo.latitude,
        lng: photo.longitude,
        photos: []
      }
    }
    acc[key].photos.push(photo)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Map View</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {photosWithLocation.length} photos with location data
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {photosWithLocation.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No photos with location data</p>
              <p className="text-sm mt-1">Photos with GPS coordinates will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map Placeholder */}
            <div className="card p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="aspect-video flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Interactive Map</p>
                  <p className="text-sm mt-2">
                    Map integration coming soon
                  </p>
                  <p className="text-xs mt-1 text-gray-400">
                    (Leaflet or Google Maps will be integrated)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Location Groups */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Locations</h3>
              <div className="space-y-4">
                {Object.entries(locationGroups).map(([key, group]) => (
                  <div key={key} className="card p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">
                          {group.lat.toFixed(4)}, {group.lng.toFixed(4)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {group.photos.slice(0, 8).map((photo) => (
                            <div
                              key={photo.id}
                              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <img
                                src={`http://localhost:8000/thumbnails/${photo.id}/thumbnail.jpg`}
                                alt={photo.file_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {group.photos.length > 8 && (
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                              +{group.photos.length - 8}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={`http://localhost:8000/thumbnails/${selectedPhoto.id}/preview.jpg`}
              alt={selectedPhoto.file_name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
