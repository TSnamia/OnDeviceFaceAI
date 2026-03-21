import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { User, Loader2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchPeople, fetchPersonPhotos } from '../services/api'
import { useState } from 'react'

export default function People() {
  const { t } = useTranslation()
  const [selectedPerson, setSelectedPerson] = useState(null)
  const navigate = useNavigate()
  
  const { data: people = [], isLoading, error } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  })
  
  console.log('People array:', people)
  
  const { data: personPhotos, isLoading: photosLoading } = useQuery({
    queryKey: ['person-photos', selectedPerson?.id],
    queryFn: () => fetchPersonPhotos(selectedPerson.id),
    enabled: !!selectedPerson,
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
          <p className="text-sm mt-1">{t('navigation.import')} {t('common.search')}</p>
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
              onClick={() => navigate(`/people/${person.id}`)}
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
      
      {selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPerson(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedPerson.name}</h2>
                <p className="text-sm text-gray-500">{selectedPerson.face_count} photos</p>
              </div>
              <button onClick={() => setSelectedPerson(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {photosLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : personPhotos?.photos && personPhotos.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {personPhotos.photos.map((photo) => (
                    <div key={photo.id} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={`http://localhost:8000/thumbnails/${photo.id}/thumbnail.jpg`}
                        alt={photo.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No photos found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
