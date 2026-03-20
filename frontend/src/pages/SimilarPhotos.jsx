import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Image as ImageIcon, Percent } from 'lucide-react'
import PhotoGrid from '../components/PhotoGrid'

export default function SimilarPhotos() {
  const [searchParams] = useSearchParams()
  const photoId = searchParams.get('photoId')
  const [threshold, setThreshold] = useState(0.8)

  const { data, isLoading } = useQuery({
    queryKey: ['similar-photos', photoId, threshold],
    queryFn: async () => {
      if (!photoId) return null
      const response = await fetch(
        `http://localhost:8000/api/v1/similarity/photos/${photoId}/similar?threshold=${threshold}&limit=50`
      )
      return response.json()
    },
    enabled: !!photoId
  })

  if (!photoId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No photo selected</p>
          <p className="text-sm mt-1">Select a photo to find similar images</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const similarPhotos = data?.similar_photos || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Similar Photos</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Found {similarPhotos.length} similar photos
            </p>
          </div>
        </div>

        {/* Threshold Slider */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium flex items-center space-x-2">
            <Percent className="w-4 h-4" />
            <span>Similarity Threshold:</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm font-mono">{(threshold * 100).toFixed(0)}%</span>
        </div>
      </div>

      {similarPhotos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No similar photos found</p>
            <p className="text-sm mt-1">Try lowering the similarity threshold</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {similarPhotos.map((photo) => (
              <div key={photo.photo_id} className="relative group">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={`http://localhost:8000/thumbnails/${photo.photo_id}/thumbnail.jpg`}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                  {(photo.similarity * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
