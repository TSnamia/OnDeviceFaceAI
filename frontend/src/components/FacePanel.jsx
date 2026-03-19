import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Edit2, Merge, Split } from 'lucide-react'
import { fetchPeople, renamePerson } from '../services/api'
import { useState } from 'react'

export default function FacePanel({ show }) {
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const queryClient = useQueryClient()
  
  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => renamePerson(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries(['people'])
      setIsRenaming(false)
      setSelectedPerson(null)
      setNewName('')
    },
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
                onClick={() => setSelectedPerson(person)}
                className={`card p-3 cursor-pointer transition-all ${
                  selectedPerson?.id === person.id
                    ? 'ring-2 ring-primary-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
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
        <button 
          onClick={() => {
            if (selectedPerson) {
              setIsRenaming(true)
              setNewName(selectedPerson.name)
            }
          }}
          disabled={!selectedPerson}
          className="w-full btn btn-secondary text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit2 className="w-4 h-4" />
          <span>Rename</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            disabled={!selectedPerson}
            className="btn btn-ghost text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Merge className="w-4 h-4" />
            <span>Merge</span>
          </button>
          <button 
            disabled={!selectedPerson}
            className="btn btn-ghost text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Split className="w-4 h-4" />
            <span>Split</span>
          </button>
        </div>
      </div>
      
      {isRenaming && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsRenaming(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Rename Person</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700"
              placeholder="Enter new name"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (newName.trim()) {
                    renameMutation.mutate({ id: selectedPerson.id, name: newName.trim() })
                  }
                }}
                disabled={!newName.trim() || renameMutation.isPending}
                className="flex-1 btn btn-primary"
              >
                {renameMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                className="flex-1 btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
