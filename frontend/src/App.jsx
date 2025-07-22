import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main app container with proper mobile viewport handling */}
      <div className="min-h-screen overflow-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomCode" element={<RoomPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App