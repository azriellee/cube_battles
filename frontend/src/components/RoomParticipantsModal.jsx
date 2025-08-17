import React from "react";

const formatDate = (iso) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const RoomParticipantsModals = ({
  // States
  showRoomParticipants,
  roomParticipants,
  isLoadingParticipants,
  selectedPlayerDetails,
  showPlayerProfile,
  isLoadingPlayerDetails,

  // Actions
  fetchRoomParticipants,
  handleViewPlayerProfile,
  closeRoomParticipants,
  closePlayerProfile,

  // Props
  roomCode,
  username,
}) => {
  return (
    <>
      {/* Room Participants Modal */}
      {showRoomParticipants && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  👥 Room Participants
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchRoomParticipants}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors text-sm"
                    title="Refresh Participants"
                    disabled={isLoadingParticipants}
                  >
                    🔄
                  </button>
                  <button
                    onClick={closeRoomParticipants}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Room Code:{" "}
                <span className="font-mono font-semibold">{roomCode}</span>
              </p>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-100px)]">
              {isLoadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
                    Loading participants...
                  </div>
                </div>
              ) : roomParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-2">👥</div>
                  <p className="text-gray-600 text-sm sm:text-base">
                    No participants found in this room.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {roomParticipants.map((participant, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-3 ${
                          (participant.playerName || participant) === username
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(participant.playerName || participant) ===
                              username && (
                              <span className="text-blue-500">👤</span>
                            )}
                            <span
                              className={`font-medium text-sm ${
                                (participant.playerName || participant) ===
                                username
                                  ? "text-blue-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {participant.playerName || participant}
                            </span>
                            {(participant.playerName || participant) ===
                              username && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleViewPlayerProfile(
                                participant.playerName || participant
                              )
                            }
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded transition-colors"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="py-3 px-4 font-semibold text-gray-800">
                            Player Name
                          </th>
                          <th className="py-3 px-4 text-center font-semibold text-gray-800">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomParticipants.map((participant, index) => (
                          <tr
                            key={index}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              (participant.playerName || participant) ===
                              username
                                ? "bg-blue-50 border-blue-200"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {(participant.playerName || participant) ===
                                  username && (
                                  <span className="text-blue-500">👤</span>
                                )}
                                <span
                                  className={`font-medium ${
                                    (participant.playerName || participant) ===
                                    username
                                      ? "text-blue-600"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {participant.playerName || participant}
                                </span>
                                {(participant.playerName || participant) ===
                                  username && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() =>
                                  handleViewPlayerProfile(
                                    participant.playerName || participant
                                  )
                                }
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors text-sm"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player Profile Modal */}
      {showPlayerProfile && (
        <div className="fixed inset-0 bg-backdrop-blur-sm bg-opacity-50 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-auto border border-gray-300 p-6 text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🏆 Player Profile</h3>
              <button
                onClick={closePlayerProfile}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close player profile"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {isLoadingPlayerDetails ? (
              <div className="text-center text-gray-500">
                Loading player details...
              </div>
            ) : selectedPlayerDetails ? (
              <div className="space-y-3 text-sm sm:text-base">
                <p>
                  <span className="text-gray-700">Name:</span>{" "}
                  {selectedPlayerDetails.playerName}
                </p>
                <p>
                  <span className="text-gray-700">Average:</span>{" "}
                  {selectedPlayerDetails.averageTime
                    ? `${selectedPlayerDetails.averageTime}s`
                    : "N/A"}
                </p>
                <p>
                  <span className="text-gray-700">Best Solve:</span>{" "}
                  {selectedPlayerDetails.bestSolve
                    ? `${selectedPlayerDetails.bestSolve}s`
                    : "N/A"}
                </p>
                <p>
                  <span className="text-gray-700">Best Ao5:</span>{" "}
                  {selectedPlayerDetails.bestAo5
                    ? `${selectedPlayerDetails.bestAo5}s`
                    : "N/A"}
                </p>
                <p>
                  <span className="text-gray-700">Best Ao12:</span>{" "}
                  {selectedPlayerDetails.bestAo12
                    ? `${selectedPlayerDetails.bestAo12}s`
                    : "N/A"}
                </p>
                <p>
                  <span className="text-gray-700">Total Solves:</span>{" "}
                  {selectedPlayerDetails.numSolves ?? 0}
                </p>
                <p>
                  <span className="text-gray-700">Date Joined:</span>{" "}
                  {formatDate(selectedPlayerDetails.dateJoined) ?? 0}
                </p>
              </div>
            ) : (
              <div className="text-center text-red-500">
                Failed to load player details.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RoomParticipantsModals;
