import { Search as SearchIcon } from 'lucide-react'

export default function Search() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-gray-500">
        <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Advanced Search</p>
        <p className="text-sm mt-1">Coming soon</p>
      </div>
    </div>
  )
}
