import { useQuery } from '@tanstack/react-query'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { fetchPhotos } from '../services/api'
import PhotoGrid from '../components/PhotoGrid'

export default function Gallery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchPhotos(),
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
          <p>Error loading photos</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!data?.photos || data.photos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No photos yet</p>
          <p className="text-sm mt-1">Click Import to add your photos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">
          All Photos ({data.total})
        </h2>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <PhotoGrid photos={data.photos} />
      </div>
    </div>
  )
}
