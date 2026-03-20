import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Save, X, Calendar, Image as ImageIcon, Users } from 'lucide-react'
import { fetchPersonPhotos, fetchPeople } from '../services/api'

export default function PersonProfile() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  
  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  const person = people.find(p => p.id === parseInt(personId))
  
  const { data: photosData, isLoading } = useQuery({
    queryKey: ['person-photos', personId],
    queryFn: () => fetchPersonPhotos(personId),
    enabled: !!personId,
  })
  
  const photos = photosData?.photos || []
  
  // Group photos by date
  const photosByDate = photos.reduce((acc, photo) => {
    const date = photo.taken_at ? new Date(photo.taken_at).toLocaleDateString() : 'Unknown Date'
    if (!acc[date]) acc[date] = []
    acc[date].push(photo)
    return acc
  }, {})
  
  const handleSaveNotes = () => {
    // TODO: Implement save notes API
    alert('Notes saved (API to be implemented)')
    setIsEditingNotes(false)
  }

  if (!person) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Person not found</p>
          <button onClick={() => navigate('/people')} className="btn btn-primary mt-4">
            Back to People
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8">
        <button
          onClick={() => navigate('/people')}
          className="flex items-center space-x-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to People</span>
        </button>
        
        <div className="flex items-start space-x-6">
          <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {person.thumbnail_path ? (
              <img
                src={person.thumbnail_path}
                alt={person.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Users className="w-16 h-16" />
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{person.name}</h1>
            <div className="flex items-center space-x-6 text-white text-opacity-90">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5" />
                <span>{person.face_count} photos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Member since {new Date(person.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Photos</div>
            <div className="text-3xl font-bold">{person.face_count}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Verified</div>
            <div className="text-3xl font-bold">{person.is_verified ? 'Yes' : 'No'}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Dates</div>
            <div className="text-3xl font-bold">{Object.keys(photosByDate).length}</div>
          </div>
        </div>
        
        {/* Notes Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="btn btn-ghost text-sm flex items-center space-x-1"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveNotes}
                  className="btn btn-primary text-sm flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="btn btn-ghost text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {isEditingNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this person..."
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              {notes || 'No notes yet. Click Edit to add notes.'}
            </p>
          )}
        </div>
        
        {/* Photos by Date */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Photos Timeline</h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading photos...</div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No photos found</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(photosByDate)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([date, datePhotos]) => (
                  <div key={date}>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      {date} ({datePhotos.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {datePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                        >
                          <img
                            src={`http://localhost:8000/thumbnails/${photo.id}/thumbnail.jpg`}
                            alt={photo.file_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
