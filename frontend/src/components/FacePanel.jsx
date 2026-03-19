import { useQuery } from '@tanstack/react-query'
import { User, Edit2, Merge, Split } from 'lucide-react'
import { fetchPeople } from '../services/api'

export default function FacePanel() {
  const { data: people, isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>People</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            Loading people...
          </div>
        ) : !people || people.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No people detected yet</p>
            <p className="text-sm mt-1">Import photos to start</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {people.map((person) => (
              <div
                key={person.id}
                className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                  {person.thumbnail_path ? (
                    <img
                      src={person.thumbnail_path}
                      alt={person.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="text-sm font-medium truncate">{person.name}</div>
                <div className="text-xs text-gray-500">{person.face_count} photos</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button className="w-full btn btn-secondary text-sm flex items-center justify-center space-x-2">
          <Edit2 className="w-4 h-4" />
          <span>Rename</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-ghost text-sm flex items-center justify-center space-x-1">
            <Merge className="w-4 h-4" />
            <span>Merge</span>
          </button>
          <button className="btn btn-ghost text-sm flex items-center justify-center space-x-1">
            <Split className="w-4 h-4" />
            <span>Split</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
