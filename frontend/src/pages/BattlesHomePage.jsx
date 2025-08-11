import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom, getPlayerRooms } from "../services/api";
import { useAuth } from "../services/hooks/useAuth";
import { useIsMobile } from "../services/hooks/useIsMobile"; // import your mobile hook

function HomePage() {
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentUser?.displayName) return;

    const fetchRooms = async () => {
      setLoadingRooms(true);
      setRoomsError("");
      try {
        const response = await getPlayerRooms(currentUser.displayName);
        // Handle null or undefined response or rooms array
        if (response && Array.isArray(response.rooms)) {
          setJoinedRooms(response.rooms);
        } else {
          // If response is null or rooms not an array, set empty array
          setJoinedRooms([]);
          if (response === null) {
            // optional: you can clear errors or leave a message
            setRoomsError("");
          } else {
            setRoomsError("Failed to load joined rooms");
          }
        }
      } catch (err) {
        console.error("Error fetching joined rooms:", err);
        setRoomsError("Failed to load joined rooms");
        setJoinedRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [currentUser]);

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
      const response = await joinRoom(roomCode.trim().toUpperCase(), currentUser.displayName);
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

  const handleJoinExistingRoom = async (code) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await joinRoom(code, currentUser.displayName);
      if (response.success) {
        navigate(`/room/${response.roomCode}`);
      } else {
        setError(response.error || "Failed to join room");
      }
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error("Join room error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-yellow-800 via-gray-500 to-red-900
        flex flex-col items-center justify-start p-4 ${
          isMobile ? "pt-6" : "pt-12"
        }`}
    >
      {/* Top bar with Home button aligned right */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <button
          onClick={() => navigate("/")}
          className="text-xs px-3 py-1 bg-green-700 hover:bg-gray-700 text-white rounded-md transition-colors"
          aria-label="Go to Home"
        >
          Home
        </button>
      </div>

      {/* Create Room Button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full bg-blue-700 hover:bg-blue-500 disabled:bg-blue-400/50 
            text-white font-semibold py-4 rounded-xl transition duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900
            shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none
            text-lg touch-manipulation"
        >
          {isLoading ? "Creating..." : "Create New Room"}
        </button>
      </div>

      {/* Join Room Form */}
      <form
        onSubmit={handleJoinRoom}
        className="w-full max-w-md mb-8"
        aria-label="Join room form"
      >
        <input
          type="text"
          id="roomCode"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-character room code"
          maxLength={6}
          className="w-full px-4 py-3 mb-3 bg-gray-700/60 border border-gray-600 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
            text-center text-xl font-mono tracking-wider text-white placeholder-gray-400
            backdrop-blur-sm transition duration-200 touch-manipulation"
          disabled={isLoading}
          aria-describedby="roomCodeHelp"
        />
        <button
          type="submit"
          disabled={isLoading || !roomCode.trim()}
          className="w-full bg-green-700 hover:bg-green-500 disabled:bg-gray-800/50 
            text-white font-semibold py-3 rounded-xl transition duration-200
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900
            shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none
            text-lg touch-manipulation"
        >
          {isLoading ? "Joining..." : "Join Room"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div
          className="w-full max-w-md bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm text-center"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Joined Rooms Section */}
      <div className="w-full max-w-md bg-gray-900/80 rounded-xl p-4 border border-gray-700 shadow-lg backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4 text-center">
          Joined Rooms
        </h2>

        {loadingRooms ? (
          <p className="text-gray-300 text-center">Loading rooms...</p>
        ) : roomsError ? (
          <p className="text-red-500 text-center">{roomsError}</p>
        ) : joinedRooms.length === 0 ? (
          <p className="text-gray-400 text-center">No joined rooms found.</p>
        ) : (
          <ul className="space-y-3">
            {joinedRooms.map(({ roomCode })=> (
              <li key={roomCode}>
                <button
                  onClick={() => handleJoinExistingRoom(roomCode)}
                  disabled={isLoading}
                  className="w-full text-white bg-yellow-900 hover:bg-yellow-600
                    py-3 rounded-lg font-mono tracking-widest text-lg text-center
                    transition duration-200 shadow-md hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-400
                    focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {roomCode}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default HomePage;
