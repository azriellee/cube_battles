import React, { useEffect, useState } from "react";
import { getPlayerDetails } from "../services/api";
import { doSignOut } from "../firebase/auth";

export default function ProfileModal({ playerName, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerName) return;

    getPlayerDetails(playerName)
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to load stats:", err))
      .finally(() => setLoading(false));
  }, [playerName]);

  const formatDate = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSignOut = async () => {
    try {
      await doSignOut();
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : stats ? (
          <div className="space-y-3 text-sm sm:text-base">
            <p>
              <span className="text-gray-400">Name:</span> {stats.playerName}
            </p>
            <p>
              <span className="text-gray-400">Email:</span> {stats.email}
            </p>
            <p>
              <span className="text-gray-400">Date Joined:</span>{" "}
              {formatDate(stats.dateJoined)}
            </p>
            <p>
              <span className="text-gray-400">Total Solves:</span>{" "}
              {stats.numSolves ?? 0}
            </p>
            <p>
              <span className="text-gray-400">Average Time:</span>{" "}
              {stats.averageTime ? `${stats.averageTime}s` : "N/A"}
            </p>
            <p>
              <span className="text-gray-400">Best Time:</span>{" "}
              {stats.bestSolve ? `${stats.bestSolve}s` : "N/A"}
            </p>
            <p>
              <span className="text-gray-400">Best Ao5:</span>{" "}
              {stats.bestAo5 ?? "N/A"}
            </p>
            <p>
              <span className="text-gray-400">Best Ao12:</span>{" "}
              {stats.bestAo12 ?? "N/A"}
            </p>
          </div>
        ) : (
          <div className="text-red-400">No stats found.</div>
        )}
        {/* Sign Out Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
