import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, Plus, Eye, EyeOff } from 'lucide-react'

export default function PrivateAlbums() {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)

  const handleUnlock = (e) => {
    e.preventDefault()
    // Simple password check - in production, this should be server-side
    const privatePassword = localStorage.getItem('private_albums_password') || 'private'
    
    if (password === privatePassword) {
      setIsUnlocked(true)
    } else {
      alert('Incorrect password')
    }
  }

  if (!isUnlocked) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Private Albums</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter password to access private albums
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 pr-12 input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full btn btn-primary">
                Unlock
              </button>
            </form>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Default password: "private"
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold">Private Albums</h2>
          </div>
          <button className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Private Album</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="text-center text-gray-500 py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No private albums yet</p>
          <p className="text-sm mt-1">Create a private album to keep photos secure</p>
        </div>
      </div>
    </div>
  )
}
