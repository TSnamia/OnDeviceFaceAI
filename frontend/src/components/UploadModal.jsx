import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Folder, Image as ImageIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadPhotos, importFolder } from '../services/api'

export default function UploadModal({ onClose }) {
  const [uploadMode, setUploadMode] = useState('files')
  const [folderPath, setFolderPath] = useState('')
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: uploadPhotos,
    onSuccess: () => {
      queryClient.invalidateQueries(['photos'])
      onClose()
    },
  })

  const folderMutation = useMutation({
    mutationFn: (path) => importFolder(path, true),
    onSuccess: () => {
      queryClient.invalidateQueries(['photos'])
      onClose()
    },
  })

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif']
    },
    onDrop: (files) => {
      if (files.length > 0) {
        uploadMutation.mutate(files)
      }
    }
  })

  const handleFolderImport = () => {
    if (folderPath.trim()) {
      folderMutation.mutate(folderPath)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Import Photos</h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setUploadMode('files')}
              className={`flex-1 btn ${uploadMode === 'files' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Files
            </button>
            <button
              onClick={() => setUploadMode('folder')}
              className={`flex-1 btn ${uploadMode === 'folder' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Folder className="w-4 h-4 mr-2" />
              Import Folder
            </button>
          </div>
          
          {uploadMode === 'files' ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-lg">Drop the files here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">Drag & drop photos here</p>
                  <p className="text-sm text-gray-500">or click to select files</p>
                  <p className="text-xs text-gray-400 mt-4">
                    Supports: JPG, PNG, HEIC
                  </p>
                </>
              )}
              
              {acceptedFiles.length > 0 && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {acceptedFiles.length} file(s) selected
                </div>
              )}
              
              {uploadMutation.isPending && (
                <div className="mt-4">
                  <div className="text-sm text-primary-600">Uploading...</div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Folder Path
                </label>
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="/path/to/photos"
                  className="w-full input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the full path to the folder containing your photos
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recursive"
                  className="rounded"
                  defaultChecked
                />
                <label htmlFor="recursive" className="text-sm">
                  Include subfolders
                </label>
              </div>
              
              <button
                onClick={handleFolderImport}
                disabled={!folderPath.trim() || folderMutation.isPending}
                className="w-full btn btn-primary"
              >
                {folderMutation.isPending ? 'Importing...' : 'Import Folder'}
              </button>
            </div>
          )}
          
          {(uploadMutation.isError || folderMutation.isError) && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              Error: {uploadMutation.error?.message || folderMutation.error?.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
