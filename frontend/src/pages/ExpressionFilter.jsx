import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Smile, Frown, Meh, Angry, Zap } from 'lucide-react'
import PhotoGrid from '../components/PhotoGrid'

const expressionIcons = {
  happy: Smile,
  sad: Frown,
  neutral: Meh,
  angry: Angry,
  surprise: Zap
}

const expressionColors = {
  happy: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  sad: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  neutral: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  angry: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  surprise: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
}

export default function ExpressionFilter() {
  const [selectedExpression, setSelectedExpression] = useState('happy')
  const [confidence, setConfidence] = useState(0.5)

  const { data, isLoading } = useQuery({
    queryKey: ['expression-photos', selectedExpression, confidence],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:8000/api/v1/expressions/photos/filter/expression?expression=${selectedExpression}&confidence=${confidence}&limit=200`
      )
      return response.json()
    }
  })

  const photos = data?.photos || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Expression Filter</h2>

        {/* Expression Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(expressionIcons).map(([expr, Icon]) => (
            <button
              key={expr}
              onClick={() => setSelectedExpression(expr)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedExpression === expr
                  ? expressionColors[expr]
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="capitalize">{expr}</span>
            </button>
          ))}
        </div>

        {/* Confidence Slider */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">
            Confidence:
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm font-mono">{(confidence * 100).toFixed(0)}%</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Found {photos.length} photos with {selectedExpression} expression
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            {React.createElement(expressionIcons[selectedExpression], {
              className: "w-16 h-16 mx-auto mb-4 opacity-50"
            })}
            <p className="text-lg">No {selectedExpression} photos found</p>
            <p className="text-sm mt-1">Try lowering the confidence threshold</p>
          </div>
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  )
}
