import { useState } from 'react'
import Sidebar from './Sidebar'
import FacePanel from './FacePanel'
import Header from './Header'

export default function Layout({ children }) {
  const [showFacePanel, setShowFacePanel] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Header 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        showFacePanel={showFacePanel}
        setShowFacePanel={setShowFacePanel}
      />
      
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
