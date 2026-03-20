import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, CheckSquare, Trash2, FolderInput, X, Play, Download } from 'lucide-react'
import { fetchPhotos } from '../services/api'
import PhotoGrid from '../components/PhotoGrid'
import Slideshow from '../components/Slideshow'

export default function Gallery() {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [showSlideshow, setShowSlideshow] = useState(false)
  const queryClient = useQueryClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchPhotos(),
  })

  const handlePhotoSelect = (photo) => {
    setSelectedPhotos(prev => {
      const exists = prev.find(p => p.id === photo.id)
      if (exists) {
        return prev.filter(p => p.id !== photo.id)
      } else {
        return [...prev, photo]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedPhotos.length === data.photos.length) {
      setSelectedPhotos([])
    } else {
      setSelectedPhotos([...data.photos])
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (photoIds) => 
      fetch('http://localhost:8000/api/v1/photos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoIds)
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['photos'])
      setSelectedPhotos([])
      setSelectionMode(false)
    },
  })

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedPhotos.length} photos?`)) return
    
    const photoIds = selectedPhotos.map(p => p.id)
    deleteMutation.mutate(photoIds)
  }

  const handleCancelSelection = () => {
    setSelectedPhotos([])
    setSelectionMode(false)
  }

  const handleExportSelected = async () => {
    if (!selectedPhotos || selectedPhotos.length === 0) return

    const destination = window.prompt(
      'Export destination path (server-side path):',
      'backend/exports'
    )
    if (!destination) return

    const organize_by = window.prompt('Organize by: date / person / album / event / flat', 'date')
    const organizeBySafe = ['date', 'person', 'album', 'event', 'flat'].includes(organize_by) ? organize_by : 'date'

    const res = await fetch('http://localhost:8000/api/v1/export/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo_ids: selectedPhotos.map((p) => p.id),
        destination,
        organize_by: organizeBySafe,
        preserve_structure: false,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      alert(`Export failed: ${data?.detail || 'Unknown error'}`)
      return
    }

    alert(
      `Export done.\nExported: ${data.exported}\nFailed: ${data.failed}\nTotal: ${data.total_size_mb.toFixed(2)} MB\nDestination: ${data.destination}`
    )
  }

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
          <FolderInput className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No photos yet</p>
          <p className="text-sm mt-1">Click Import to add your photos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            All Photos ({data.total})
          </h2>
          
          {!selectionMode ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSlideshow(true)}
                disabled={data.photos.length === 0}
                className="btn btn-ghost flex items-center space-x-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Slideshow</span>
              </button>
              <button
                onClick={() => setSelectionMode(true)}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Select</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedPhotos.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="btn btn-ghost text-sm"
              >
                {selectedPhotos.length === data.photos.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedPhotos.length === 0}
                className="btn btn-ghost text-red-600 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelSelection}
                className="btn btn-ghost"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportSelected}
                disabled={selectedPhotos.length === 0}
                className="btn btn-ghost text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export selected photos"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <PhotoGrid 
        photos={data.photos} 
        selectionMode={selectionMode}
        selectedPhotos={selectedPhotos}
        onPhotoSelect={handlePhotoSelect}
      />
      
      {showSlideshow && (
        <Slideshow
          photos={data.photos}
          initialIndex={0}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </div>
  )
}
