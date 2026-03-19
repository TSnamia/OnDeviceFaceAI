import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const fetchPhotos = async (skip = 0, limit = 100) => {
  const response = await api.get('/photos/', {
    params: { skip, limit }
  })
  return response.data
}

export const fetchPhoto = async (photoId) => {
  const response = await api.get(`/photos/${photoId}`)
  return response.data
}

export const uploadPhotos = async ({ files, onProgress } = {}) => {
  const formData = new FormData()
  ;(files || []).forEach((file) => {
    formData.append('files', file)
  })
  
  const response = await api.post('/photos/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      const percent = Math.round((event.loaded * 100) / event.total)
      onProgress(percent)
    },
  })
  return response.data
}

export const importFolder = async (folderPath, recursive = true) => {
  const response = await api.post('/photos/import-folder', {
    folder_path: folderPath,
    recursive,
  })
  return response.data
}

export const deletePhoto = async (photoId, deleteFile = false) => {
  const response = await api.delete(`/photos/${photoId}`, {
    params: { delete_file: deleteFile }
  })
  return response.data
}

export const findDuplicates = async (threshold = 5) => {
  const response = await api.get('/photos/duplicates/find', {
    params: { threshold }
  })
  return response.data
}

export const detectFaces = async (photoId) => {
  const response = await api.post(`/faces/detect/${photoId}`)
  return response.data
}

export const clusterAllFaces = async () => {
  const response = await api.post('/faces/cluster-all')
  return response.data
}

export const fetchPeople = async () => {
  const response = await api.get('/faces/people')
  return response.data
}

export const fetchPerson = async (personId) => {
  const response = await api.get(`/faces/people/${personId}`)
  return response.data
}

export const renamePerson = async (personId, name) => {
  const response = await api.put(`/faces/people/${personId}/rename`, { name })
  return response.data
}

export const fetchPersonPhotos = async (personId) => {
  const response = await api.get(`/faces/people/${personId}/photos`)
  return response.data
}

export const mergePeople = async (personId1, personId2, keepName = null) => {
  const response = await api.post('/faces/people/merge', {
    person_id1: personId1,
    person_id2: personId2,
    keep_name: keepName,
  })
  return response.data
}

export const splitPerson = async (personId) => {
  const response = await api.post(`/faces/people/${personId}/split`)
  return response.data
}

export default api
