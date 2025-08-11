import React, { useState } from "react";
import { useAuth } from "../services/hooks/useAuth";
import ProfileModal from "./ProfileModal";
import { UserCircle } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function ProtectedLayout({ children }) {
  const { currentUser, loading } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  if (loading) {
    return <div className="text-center text-gray-400 mt-8">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="h-16 w-full px-6 py-4 bg-gray-800 flex justify-between items-center shadow-md z-50">
        <div className="text-lg font-bold">Cube Battles</div>
        <button
          onClick={() => setShowProfile(true)}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full"
          title="View Profile"
        >
          <UserCircle size={24} />
        </button>
      </div>

      {/* Main Page Content */}
      <main className="flex-1 px-4 pb-4 overflow-y-auto">{children}</main>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          playerName={currentUser.displayName}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
