import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../services/api";

function HomePage() {
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await createRoom();
      if (response.success) {
        navigate(`/room/${response.roomCode}`);
      } else {
        setError(response.error || "Failed to create room");
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error("Create room error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await joinRoom(roomCode.trim().toUpperCase());
      if (response.success) {
        navigate(`/room/${response.roomCode}`);
      } else {
        setError(response.error || "Failed to join room");
      }
    } catch (err) {
      setError(
        "Failed to join room. Please check the room code and try again."
      );
      console.error("Join room error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    // Updated HomePage component for mobile PWA
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-gray-700">
        <div className="text-center mb-8 sm:mb-12">
          <img
            src="/logo.png"
            alt="Speedcube Battles Logo"
            className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full shadow-lg"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Cube Battles
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            Battle your friends in Rubik's cube solving!
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Create Room Section */}
          <div className="text-center">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400/50 
                     text-white font-semibold py-4 px-4 rounded-xl transition duration-200
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800
                     shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none
                     text-base sm:text-lg touch-manipulation"
            >
              {isLoading ? "Creating..." : "Create New Room"}
            </button>
            <p className="text-sm text-gray-400 mt-3">
              Start a new battle room
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Join Room Section */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label
                htmlFor="roomCode"
                className="block text-sm font-medium text-gray-300 mb-3"
              >
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
                       text-center text-lg sm:text-xl font-mono tracking-wider text-white
                       placeholder-gray-400 backdrop-blur-sm transition duration-200
                       touch-manipulation"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !roomCode.trim()}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600/50 
                     text-white font-semibold py-4 px-4 rounded-xl transition duration-200
                     focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800
                     shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none
                     text-base sm:text-lg touch-manipulation"
            >
              {isLoading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            Enter an existing room code or create a new room to start battling!
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
