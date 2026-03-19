import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPhotos, fetchPeople } from '../services/api'
import PhotoGrid from '../components/PhotoGrid'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const { data: allPhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchPhotos(),
  })
  
  const { data: allPeople = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  const isLoading = photosLoading || peopleLoading
  
  // Filter photos by filename
  const filteredPhotos = query 
    ? allPhotos.photos?.filter(photo => 
        photo.file_name.toLowerCase().includes(query.toLowerCase())
      ) || []
    : []
  
  // Filter people by name
  const filteredPeople = query
    ? allPeople.filter(person =>
        person.name.toLowerCase().includes(query.toLowerCase())
      )
    : []
  
  if (!query) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Search your photos</p>
          <p className="text-sm mt-1">Enter a search term in the header</p>
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
  
  const totalResults = filteredPhotos.length + filteredPeople.length
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">
          Search results for "{query}"
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8">
        {filteredPeople.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">People ({filteredPeople.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredPeople.map((person) => (
                <div key={person.id} className="card p-3 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center">
                    <SearchIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-sm font-medium truncate">{person.name}</div>
                  <div className="text-xs text-gray-500">{person.face_count} photos</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {filteredPhotos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Photos ({filteredPhotos.length})</h3>
            <PhotoGrid photos={filteredPhotos} />
          </div>
        )}
        
        {totalResults === 0 && (
          <div className="text-center text-gray-500 py-12">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No results found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
