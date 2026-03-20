import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderHeart, Plus, Image as ImageIcon, CheckSquare, X } from 'lucide-react'
import PhotoGrid from '../components/PhotoGrid'
import { addPhotosToAlbum, createAlbum, fetchAlbumPhotos, fetchPhotos, fetchAlbums } from '../services/api'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

export default function Albums() {
  const queryClient = useQueryClient()
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)

  const [newAlbumName, setNewAlbumName] = useState('')
  const [addingPhotos, setAddingPhotos] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState([])

  const { data: albums = [], isLoading: albumsLoading } = useQuery({
    queryKey: ['albums'],
    queryFn: fetchAlbums,
  })

  const { data: albumPhotosData, isLoading: albumPhotosLoading } = useQuery({
    queryKey: ['album-photos', selectedAlbumId],
    queryFn: () => fetchAlbumPhotos(selectedAlbumId),
    enabled: !!selectedAlbumId,
  })

  const albumPhotos = albumPhotosData?.photos || []
  const albumTotal = albumPhotosData?.total || 0

  const createMutation = useMutation({
    mutationFn: () => createAlbum({ name: newAlbumName.trim() }),
    onSuccess: () => {
      setNewAlbumName('')
      queryClient.invalidateQueries(['albums'])
    },
  })

  const addMutation = useMutation({
    mutationFn: async ({ albumId, photoIds, coverPhotoId }) =>
      addPhotosToAlbum({ albumId, photoIds, coverPhotoId }),
    onSuccess: () => {
      setAddingPhotos(false)
      setSelectedPhotos([])
      queryClient.invalidateQueries(['album-photos', selectedAlbumId])
      queryClient.invalidateQueries(['albums'])
    },
  })

  const { data: allPhotosData = { photos: [] }, isLoading: allPhotosLoading } = useQuery({
    queryKey: ['all-photos-for-albums'],
    queryFn: () => fetchPhotos(0, 200),
    enabled: addingPhotos,
  })

  const allPhotos = allPhotosData?.photos || []

  const selectedCount = selectedPhotos.length
  const coverPhotoId = selectedPhotos[0]?.id || null

  const handleTogglePhoto = (photo) => {
    setSelectedPhotos((prev) => {
      const exists = prev.some((p) => p.id === photo.id)
      return exists ? prev.filter((p) => p.id !== photo.id) : [...prev, photo]
    })
  }

  const selectedAlbum = useMemo(
    () => albums.find((a) => a.id === selectedAlbumId) || null,
    [albums, selectedAlbumId]
  )

  if (albumsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FolderHeart className="w-12 h-12 opacity-50" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Albums</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create an album and add photos (manual selection)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="New album name"
            className="input"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newAlbumName.trim() || createMutation.isPending}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          <div className="lg:col-span-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
            {albums.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FolderHeart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No albums yet</p>
                <p className="text-sm mt-1">Create one above</p>
              </div>
            ) : (
              albums.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAlbumId(a.id)}
                  className={`w-full text-left card p-3 hover:shadow-md transition-shadow ${
                    selectedAlbumId === a.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                      {a.cover_thumbnail_path ? (
                        <img
                          src={a.cover_thumbnail_path}
                          alt={`${a.name} cover`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.photo_count} photos</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2 overflow-y-auto scrollbar-thin">
            {!selectedAlbum ? (
              <div className="text-center text-gray-500 py-12">
                <FolderHeart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select an album</p>
                <p className="text-sm mt-1">Or create a new one</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{selectedAlbum.name}</h3>
                    <p className="text-sm text-gray-500">{albumTotal} photos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAddingPhotos(true)
                        setSelectedPhotos([])
                      }}
                      disabled={albumPhotosLoading}
                      className="btn btn-secondary flex items-center space-x-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Add Photos
                    </button>
                  </div>
                </div>

                {addingPhotos && (
                  <Modal
                    title="Add photos to album"
                    onClose={() => {
                      setAddingPhotos(false)
                      setSelectedPhotos([])
                    }}
                  >
                    {allPhotosLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <FolderHeart className="w-10 h-10 opacity-50 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Select up to {allPhotos.length} photos (first photo set as cover)
                          </p>
                          <p className="text-sm text-gray-500">{selectedCount} selected</p>
                        </div>
                        <PhotoGrid
                          photos={allPhotos}
                          selectionMode={true}
                          selectedPhotos={selectedPhotos}
                          onPhotoSelect={handleTogglePhoto}
                        />
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAddingPhotos(false)
                              setSelectedPhotos([])
                            }}
                            className="btn btn-ghost"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              addMutation.mutate({
                                albumId: selectedAlbumId,
                                photoIds: selectedPhotos.map((p) => p.id),
                                coverPhotoId,
                              })
                            }
                            disabled={selectedPhotos.length === 0 || addMutation.isPending}
                            className="btn btn-primary"
                          >
                            {addMutation.isPending ? 'Adding...' : 'Add to album'}
                          </button>
                        </div>
                      </>
                    )}
                  </Modal>
                )}

                {albumPhotosLoading ? (
                  <div className="text-center text-gray-500 py-8">Loading album photos...</div>
                ) : albumPhotos.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No photos in this album</p>
                    <p className="text-sm mt-1">Click “Add Photos”</p>
                  </div>
                ) : (
                  <PhotoGrid photos={albumPhotos} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
