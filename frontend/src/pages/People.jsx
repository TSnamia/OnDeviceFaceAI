import { useQuery } from '@tanstack/react-query'
import { User, Loader2 } from 'lucide-react'
import { fetchPeople } from '../services/api'

export default function People() {
  const { data: people, isLoading, error } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
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
          <p>Error loading people</p>
        </div>
      </div>
    )
  }

  if (!people || people.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No people detected yet</p>
          <p className="text-sm mt-1">Import photos to start face recognition</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">
          People ({people.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {people.map((person) => (
            <div
              key={person.id}
              className="card p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {person.thumbnail_path ? (
                  <img
                    src={person.thumbnail_path}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="text-center">
                <div className="font-medium truncate">{person.name}</div>
                <div className="text-sm text-gray-500">{person.face_count} photos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
