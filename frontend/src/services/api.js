import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export const fetchPhotos = async () => {
  const response = await api.get('/photos')
  console.log('🔍 Raw API Response:', response.data)
  console.log('🔍 Response Type:', typeof response.data)
  console.log('🔍 Is Array:', Array.isArray(response.data))
  return response.data  // Artık direkt array geliyor
}

export const uploadPhotos = async (files) => {
  const uploadPromises = []
  
  for (let file of files) {
    const formData = new FormData()
    formData.append('file', file)
    
    const promise = api.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    uploadPromises.push(promise)
  }
  
  const results = await Promise.all(uploadPromises)
  return results.map(r => r.data)
}

export const fetchPeople = async () => {
  const response = await api.get('/faces/people')
  return response.data.people || []
}
