import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Users, Edit2, Merge, Split } from 'lucide-react'
import { fetchPeople, fetchPersonPhotos, renamePerson } from '../services/api'
import { useState } from 'react'

export default function FacePanel({ show }) {
  const [selectedPeople, setSelectedPeople] = useState([])
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const queryClient = useQueryClient()
  
  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  const firstSelectedPersonId = selectedPeople?.[0]?.id
  const { data: firstSelectedPersonPhotos, isLoading: firstSelectedPersonPhotosLoading } = useQuery({
    queryKey: ['person-photos', firstSelectedPersonId],
    queryFn: () => fetchPersonPhotos(firstSelectedPersonId),
    enabled: showGroupDialog && !!firstSelectedPersonId,
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => renamePerson(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries(['people'])
      setIsRenaming(false)
      setSelectedPeople([])
      setNewName('')
    },
  })
  
  const mergeMutation = useMutation({
    mutationFn: ({ person_id1, person_id2, keep_name }) => 
      fetch('http://localhost:8000/api/v1/faces/people/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id1, person_id2, keep_name })
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['people'])
      setShowMergeDialog(false)
      setSelectedPeople([])
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
                onClick={() => {
                  if (selectedPeople.find(p => p.id === person.id)) {
                    setSelectedPeople(selectedPeople.filter(p => p.id !== person.id))
                  } else {
                    setSelectedPeople([...selectedPeople, person])
                  }
                }}
                className={`card p-3 cursor-pointer transition-all ${
                  selectedPeople.find(p => p.id === person.id)
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
            if (selectedPeople.length === 1) {
              setIsRenaming(true)
              setNewName(selectedPeople[0].name)
            }
          }}
          disabled={selectedPeople.length !== 1}
          className="w-full btn btn-secondary text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit2 className="w-4 h-4" />
          <span>Rename</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setShowMergeDialog(true)}
            disabled={selectedPeople.length < 2}
            className="btn btn-ghost text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Merge className="w-4 h-4" />
            <span>Merge</span>
          </button>
          <button 
            onClick={() => setShowGroupDialog(true)}
            disabled={selectedPeople.length === 0}
            className="btn btn-ghost text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-4 h-4" />
            <span>Group</span>
          </button>
        </div>
      </div>
      
      {isRenaming && selectedPeople.length === 1 && (
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
                    renameMutation.mutate({ id: selectedPeople[0].id, name: newName.trim() })
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
      
      {showMergeDialog && selectedPeople.length >= 2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMergeDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Merge People</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Merging {selectedPeople.length} people into one. All faces will be combined.
            </p>
            <div className="space-y-2 mb-4">
              {selectedPeople.map((person, idx) => (
                <div key={person.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <input
                    type="radio"
                    name="keepPerson"
                    value={person.id}
                    defaultChecked={idx === 0}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{person.name} ({person.face_count} photos)</span>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or enter new name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const keepId = selectedPeople[0].id
                  const mergeId = selectedPeople[1].id
                  mergeMutation.mutate({ 
                    person_id1: keepId, 
                    person_id2: mergeId, 
                    keep_name: newName.trim() || null 
                  })
                }}
                disabled={mergeMutation.isPending}
                className="flex-1 btn btn-primary"
              >
                {mergeMutation.isPending ? 'Merging...' : 'Merge'}
              </button>
              <button
                onClick={() => setShowMergeDialog(false)}
                className="flex-1 btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showGroupDialog && selectedPeople.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGroupDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Group</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Creating a group with {selectedPeople.length} people
            </p>

            {(() => {
              const coverSrc =
                selectedPeople.find((p) => p.thumbnail_path)?.thumbnail_path ||
                (firstSelectedPersonPhotos?.photos?.[0]?.id
                  ? `http://localhost:8000/thumbnails/${firstSelectedPersonPhotos.photos[0].id}/thumbnail.jpg`
                  : null)

              return (
                <div className="mb-4">
                  <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                    {firstSelectedPersonPhotosLoading ? (
                      <div className="text-sm text-gray-500">Loading cover...</div>
                    ) : coverSrc ? (
                      <img src={coverSrc} alt="Group cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Cover preview (auto-selected)</p>
                </div>
              )
            })()}

            <input
              type="text"
              placeholder="Group name (e.g., Family, Friends)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // TODO: Implement group creation
                  alert('Group feature will be implemented')
                  setShowGroupDialog(false)
                }}
                disabled={!newName.trim()}
                className="flex-1 btn btn-primary"
              >
                Create Group
              </button>
              <button
                onClick={() => setShowGroupDialog(false)}
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
