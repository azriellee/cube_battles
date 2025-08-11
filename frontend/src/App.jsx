import { Routes, Route } from "react-router-dom";
import {
  RoomPage,
  SignInPage,
  BattlesHomePage,
  HomePage,
  PracticeModePage,
} from "./pages";
import { Navigate } from "react-router-dom";

import ProtectedLayout from "./components/ProtectedLayout";

function App() {
  return (
    <div className="min-h-screen bg-gray-900 overflow-auto">
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route
          path="*"
          element={
            <ProtectedLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/practice-mode" element={<PracticeModePage />} />
                <Route path="/battles-home" element={<BattlesHomePage />} />
                <Route path="/room/:roomCode" element={<RoomPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedLayout>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
