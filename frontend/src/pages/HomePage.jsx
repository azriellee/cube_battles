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
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-12">
          <img
            src="/logo.png"
            alt="Speedcube Battles Logo"
            className="mx-auto w-24 h-24 mb-4"
          />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Cube Battles
          </h1>
          <p className="text-gray-600 text-lg">
            Battle your friends in Rubik's cube solving!
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Create Room Section */}
          <div className="text-center">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 
                         text-white font-semibold py-3 px-4 rounded-lg transition duration-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? "Creating..." : "Create New Room"}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Start a new battle room
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Join Room Section */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label
                htmlFor="roomCode"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-3 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !roomCode.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 
                         text-white font-semibold py-3 px-4 rounded-lg transition duration-200
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {isLoading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Enter an existing room code or create a new room to start battling!
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
