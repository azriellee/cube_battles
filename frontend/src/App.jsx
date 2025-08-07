import { Routes, Route } from 'react-router-dom'
import { RoomPage, SignInPage, BattlesHomePage, HomePage, PracticeModePage } from './pages'

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main app container with proper mobile viewport handling */}
      <div className="min-h-screen overflow-auto">
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/practice-mode" element={<PracticeModePage />} />
          <Route path="/battles-home" element={<BattlesHomePage />} />
          <Route path="/room/:roomCode" element={<RoomPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App