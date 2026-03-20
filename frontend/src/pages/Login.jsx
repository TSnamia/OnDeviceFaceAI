import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Check password from localStorage
      const savedPassword = localStorage.getItem('app_password')
      
      if (!savedPassword) {
        // First time setup - save password
        localStorage.setItem('app_password', password)
        localStorage.setItem('is_authenticated', 'true')
        onLogin()
        navigate('/')
      } else if (password === savedPassword) {
        // Correct password
        localStorage.setItem('is_authenticated', 'true')
        onLogin()
        navigate('/')
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              OnDeviceFaceAI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {localStorage.getItem('app_password') ? 'Enter your password' : 'Set your password'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : localStorage.getItem('app_password') ? 'Unlock' : 'Set Password'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {localStorage.getItem('app_password') 
                ? 'Your photos are protected with a password'
                : 'Create a password to protect your photo library'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
