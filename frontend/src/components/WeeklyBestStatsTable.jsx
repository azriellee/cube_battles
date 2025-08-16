import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { getWeeklyBestStats } from "../services/api"; // Adjust import path as needed
import {
  saveWeeklyBestStatsToStorage,
  getWeeklyBestStatsFromStorage,
} from "../services/storage";

const WeeklyBestStatsTable = forwardRef(
  ({ roomCode, formatTime, getWeekStart, onStatsUpdate }, ref) => {
    const [allWeeklyBestStats, setAllWeeklyBestStats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [currentWeekStats, setCurrentWeekStats] = useState(null);

    // Expose refresh function to parent via ref
    React.useImperativeHandle(ref, () => ({
      refresh: fetchWeeklyBestStats,
    }));

    const fetchWeeklyBestStats = async () => {
      if (!roomCode) return;

      setIsLoading(true);
      try {
        const response = await getWeeklyBestStats(roomCode);
        setAllWeeklyBestStats(response || []);

        const currentWeekStart = getWeekStart(new Date());
        const currentWeekData = (response || []).find(
          (item) =>
            new Date(item.weekStart).getTime() === currentWeekStart.getTime()
        );

        setCurrentWeekStats(currentWeekData || null);
        // Save to local storage
        saveWeeklyBestStatsToStorage(roomCode, response || []);

        // Pass current week stats to parent if callback provided
        if (onStatsUpdate) {
          onStatsUpdate(currentWeekData || null, response || []);
        }
      } catch (error) {
        console.error("Failed to fetch weekly best stats:", error);

        // Try to load from local storage as fallback
        const storedStats = getWeeklyBestStatsFromStorage(roomCode);
        if (storedStats !== null && storedStats !== undefined) {
          setAllWeeklyBestStats(storedStats);

          // Filter for current week
          const currentWeekStart = getWeekStart(new Date());
          const currentWeekData = storedStats.find(
            (item) =>
              new Date(item.weekStart).getTime() === currentWeekStart.getTime()
          );
          setCurrentWeekStats(currentWeekData || null);

          if (onStatsUpdate) {
            onStatsUpdate(currentWeekData || null, storedStats);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchWeeklyBestStats();
    }, [roomCode]);

    useEffect(() => {
      console.log("currentWeekStats updated:", currentWeekStats);
    }, [currentWeekStats]);

    const toggleRowExpansion = (weekStart) => {
      const newExpandedRows = new Set(expandedRows);
      if (newExpandedRows.has(weekStart)) {
        newExpandedRows.delete(weekStart);
      } else {
        newExpandedRows.add(weekStart);
      }
      setExpandedRows(newExpandedRows);
    };

    const renderPlayerStatsSubtable = (players) => {
      if (!players || players.length === 0) {
        return (
          <tr>
            <td
              colSpan="6"
              className="px-4 py-2 text-center text-gray-500 text-sm"
            >
              No player stats available for this week
            </td>
          </tr>
        );
      }

      return players.map((player, index) => (
        <tr key={`player-${index}`} className="bg-gray-50">
          <td className="px-4 py-2 border-b border-gray-200 font-mono text-sm text-blue-900">
            {player.playerName} 
          </td>
          <td className="px-4 py-2 border-b border-gray-200 font-mono text-sm text-blue-600">
            {player.bestSolve ? `${formatTime(player.bestSolve)}s` : "-"}
          </td>
          <td className="px-4 py-2 border-b border-gray-200 font-mono text-sm text-gray-600">
            {player.bestAo5 ? `${formatTime(player.bestAo5)}s` : "-"}
          </td>
          <td className="px-4 py-2 border-b border-gray-200 font-mono text-sm text-purple-600">
            {player.bestAo12 ? `${formatTime(player.bestAo12)}s` : "-"}
          </td>
          <td className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-green-600">
            {player.points || 0}
          </td>
        </tr>
      ));
    };

    const sortedWeeklyStats = [...allWeeklyBestStats].sort(
      (a, b) => new Date(b.weekStart) - new Date(a.weekStart)
    );

    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading weekly stats...</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {sortedWeeklyStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Solve
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best AO5
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best AO12
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedWeeklyStats.map((weekData, index) => {
                  const isExpanded = expandedRows.has(weekData.weekStart);
                  const isCurrentWeek =
                    currentWeekStats &&
                    new Date(weekData.weekStart).getTime() ===
                      new Date(currentWeekStats.weekStart).getTime();

                  return (
                    <React.Fragment key={weekData.weekStart}>
                      {/* Summary Row */}
                      <tr
                        className={`hover:bg-gray-50 ${
                          isCurrentWeek ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isCurrentWeek && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                Current
                              </span>
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(
                                weekData.weekStart
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {weekData.summary.bestSolve ? (
                            <div>
                              <div className="text-sm font-mono text-green-600">
                                {formatTime(
                                  weekData.summary.bestSolve.solveTime
                                )}
                                s
                              </div>
                              <div className="text-xs text-gray-500">
                                {weekData.summary.bestSolve.playerName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {weekData.summary.bestAo5 ? (
                            <div>
                              <div className="text-sm font-mono text-blue-600">
                                {formatTime(weekData.summary.bestAo5.solveTime)}
                                s
                              </div>
                              <div className="text-xs text-gray-500">
                                {weekData.summary.bestAo5.playerName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {weekData.summary.bestAo12 ? (
                            <div>
                              <div className="text-sm font-mono text-purple-600">
                                {formatTime(
                                  weekData.summary.bestAo12.solveTime
                                )}
                                s
                              </div>
                              <div className="text-xs text-gray-500">
                                {weekData.summary.bestAo12.playerName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              toggleRowExpansion(weekData.weekStart)
                            }
                            className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                          >
                            <span
                              className={`transform transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            >
                              ▶
                            </span>
                            <span className="ml-1">
                              {isExpanded ? "Hide" : "Show"} Players
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Player Stats */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" className="px-0 py-0">
                            <div className="bg-gray-50 border-t border-gray-200">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Player
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Best Solve
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Best AO5
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Best AO12
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Points
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {renderPlayerStatsSubtable(weekData.players)}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium">No weekly stats available yet</p>
            <p className="text-sm mt-2">
              Complete daily challenges to start building your weekly
              statistics!
            </p>
          </div>
        )}
      </div>
    );
  }
);

export default WeeklyBestStatsTable;
