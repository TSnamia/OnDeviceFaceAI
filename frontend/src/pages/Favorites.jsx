import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Star } from 'lucide-react'
import PhotoGrid from '../components/PhotoGrid'

export default function Favorites() {
  const queryClient = useQueryClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/v1/photos/favorites')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading favorites</p>
        </div>
      </div>
    )
  }

  const photos = data?.photos || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-xl font-semibold">
            Favorites ({photos.length})
          </h2>
        </div>
      </div>
      
      {photos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No favorite photos yet</p>
            <p className="text-sm mt-1">Click the star icon on photos to add them to favorites</p>
          </div>
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  )
}
