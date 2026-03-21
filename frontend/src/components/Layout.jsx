import { useState } from 'react'
import Sidebar from './Sidebar'
import FacePanel from './FacePanel'

export default function Layout({ children }) {
  const [showFacePanel, setShowFacePanel] = useState(true)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        
        {showFacePanel && <FacePanel />}
      </div>
    </div>
  )
}
