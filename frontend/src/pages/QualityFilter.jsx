import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import PhotoGrid from '../components/PhotoGrid'

export default function QualityFilter() {
  const [filterType, setFilterType] = useState('high') // 'high' or 'low'
  const [threshold, setThreshold] = useState(filterType === 'high' ? 0.6 : 0.4)

  const { data, isLoading } = useQuery({
    queryKey: ['quality-photos', filterType, threshold],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:8000/api/v1/photos/quality/${filterType}?threshold=${threshold}&limit=200`
      )
      return response.json()
    }
  })

  const photos = data?.photos || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Photo Quality Filter</h2>

        {/* Filter Type Toggle */}
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => {
              setFilterType('high')
              setThreshold(0.6)
            }}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              filterType === 'high'
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>High Quality</span>
          </button>
          
          <button
            onClick={() => {
              setFilterType('low')
              setThreshold(0.4)
            }}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              filterType === 'low'
                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Quality / Blurry</span>
          </button>
        </div>

        {/* Threshold Slider */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">
            Quality Threshold:
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm font-mono">{threshold.toFixed(2)}</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {filterType === 'high' 
            ? `Showing ${photos.length} high quality photos` 
            : `Showing ${photos.length} low quality/blurry photos`
          }
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            {filterType === 'high' ? (
              <>
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No high quality photos found</p>
                <p className="text-sm mt-1">Try lowering the threshold</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No low quality photos found</p>
                <p className="text-sm mt-1">Great! All your photos are good quality</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  )
}
