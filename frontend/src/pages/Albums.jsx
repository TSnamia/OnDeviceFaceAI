import { FolderHeart } from 'lucide-react'

export default function Albums() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-gray-500">
        <FolderHeart className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No albums yet</p>
        <p className="text-sm mt-1">Albums will be created automatically</p>
      </div>
    </div>
  )
}
