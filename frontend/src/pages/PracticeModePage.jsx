import React, { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, Eye, RotateCcw } from "lucide-react";
import {
  savePracticeTimesToStorage,
  loadPracticeTimesFromStorage,
} from "../services/storage";
import {
  formatTime,
  calculateAverage,
  getBestSingle,
} from "../services/metrics";
import { getScramble } from "../services/scramble";

function PracticeModePage() {
  const [solveTimes, setSolveTimes] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isHoldingSpace, setIsHoldingSpace] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);
  const [currentScramble, setCurrentScramble] = useState("");
  const [selectedSolve, setSelectedSolve] = useState(null);
  const [showScrambleModal, setShowScrambleModal] = useState(false);

  const currentTimeRef = useRef(0);
  const holdTimerRef = useRef(null);

  // Load solve times on component mount
  useEffect(() => {
    const loadedSolveTimes = loadPracticeTimesFromStorage();
    setSolveTimes(loadedSolveTimes);
    setCurrentScramble(getScramble({ type: "3x3" }));
  }, []);

  // Timer update effect
  useEffect(() => {
    let interval;
    let startTime;
    if (isTimerActive) {
      startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        currentTimeRef.current = elapsed;
        setCurrentTime(elapsed);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const stopTimer = () => {
    const finalTime = currentTimeRef.current.toFixed(2);
    setIsTimerActive(false);

    const newSolveId = Date.now().toString();
    const newSolveTimes = {
      ...solveTimes,
      [newSolveId]: {
        time: finalTime,
        scramble: currentScramble,
        timestamp: Date.now(),
      },
    };

    setSolveTimes(newSolveTimes);
    savePracticeTimesToStorage(newSolveTimes);
    setCurrentScramble(getScramble({ type: "3x3" }));
    currentTimeRef.current = 0;
  };

  // Touch handlers for mobile devices
  const handleTouchStart = useCallback(
    (event) => {
      event.preventDefault();

      if (!isTimerActive && !isHoldingSpace) {
        setIsHoldingSpace(true);
        setCanStartTimer(false);

        const holdTimer = setTimeout(() => {
          setCanStartTimer(true);
          setCurrentTime(0);
        }, 300); // 300ms hold required

        event.currentTarget.holdTimer = holdTimer;
      }
    },
    [isTimerActive, isHoldingSpace]
  );

  const handleTouchEnd = useCallback(
    (event) => {
      event.preventDefault();

      if (event.currentTarget.holdTimer) {
        clearTimeout(event.currentTarget.holdTimer);
        event.currentTarget.holdTimer = null;
      }

      if (isHoldingSpace && !isTimerActive) {
        setIsHoldingSpace(false);

        if (canStartTimer) {
          setIsTimerActive(true);
          setCurrentTime(0);
          event.stopPropagation();
        }
      } else if (isTimerActive) {
        stopTimer();
      }
    },
    [isHoldingSpace, isTimerActive, canStartTimer]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.code === "Escape" && !isTimerActive) {
        event.preventDefault();
        setActiveScramble(null);
        return;
      }

      if (event.code === "Space" && !isTimerActive && !isHoldingSpace) {
        event.preventDefault();
        setIsHoldingSpace(true);
        setCanStartTimer(false);

        // Start the hold timer
        const holdTimer = setTimeout(() => {
          setCanStartTimer(true);
          setCurrentTime(0);
        }, 300); // 300ms hold required

        return () => clearTimeout(holdTimer);
      }
    },
    [isTimerActive, isHoldingSpace]
  );

  const handleKeyUp = useCallback(
    (event) => {
      if (event.code === "Space" && isHoldingSpace && !isTimerActive) {
        event.preventDefault();
        setIsHoldingSpace(false);

        if (canStartTimer) {
          // Start timer
          setIsTimerActive(true);
          setCurrentTime(0);
        }
      } else if (isTimerActive) {
        event.preventDefault();
        stopTimer();
      }
    },
    [isHoldingSpace, isTimerActive, canStartTimer]
  );

  useEffect(() => {
    // Prevent spacebar from scrolling the page
    const preventSpaceScroll = (event) => {
      if (event.code === "Space") {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", preventSpaceScroll);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", preventSpaceScroll);
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  // Global mobile touch-to-stop effect
  useEffect(() => {
    function handleGlobalTouchEnd(event) {
      if (isTimerActive) {
        event.preventDefault();
        stopTimer();
      }
    }

    if (isTimerActive) {
      document.addEventListener("touchend", handleGlobalTouchEnd, {
        passive: false,
      });
    }

    return () => {
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isTimerActive, stopTimer]);

  const clearAllSolves = () => {
    setSolveTimes({});
    savePracticeTimesToStorage({});
  };

  const deleteSolve = (solveId) => {
    const newSolveTimes = { ...solveTimes };
    delete newSolveTimes[solveId];
    setSolveTimes(newSolveTimes);
    savePracticeTimesToStorage(newSolveTimes);
    setSelectedSolve(null);
    setShowScrambleModal(false);
  };

  const viewScramble = (solve) => {
    setSelectedSolve(solve);
    setShowScrambleModal(true);
  };

  // Calculate statistics for each solve
  const calculateStatsForSolve = (solveId) => {
    const solveIds = Object.keys(solveTimes).sort(
      (a, b) => solveTimes[a].timestamp - solveTimes[b].timestamp
    );
    const solveIndex = solveIds.indexOf(solveId);

    if (solveIndex === -1) return { ao5: null, ao12: null };

    // Get solves up to this point (inclusive)
    const solvesUpToHere = {};
    for (let i = 0; i <= solveIndex; i++) {
      solvesUpToHere[solveIds[i]] = solveTimes[solveIds[i]];
    }

    return {
      ao5: calculateAverage(solvesUpToHere, 5),
      ao12: calculateAverage(solvesUpToHere, 12),
    };
  };

  // Get current statistics
  const bestSingle = getBestSingle(solveTimes);
  const currentAo5 = calculateAverage(solveTimes, 5);
  const currentAo12 = calculateAverage(solveTimes, 12);

  // Prepare table data
  const tableData = Object.entries(solveTimes)
    .sort(([, a], [, b]) => b.timestamp - a.timestamp)
    .map(([id, solve]) => {
      const stats = calculateStatsForSolve(id);
      return {
        id,
        ...solve,
        ...stats,
      };
    });

  return (
    <div className="min-h-screen bg-gray-600 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Left Column - Table */}
          <div className="w-80 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Solve Times</h2>
              <button
                onClick={clearAllSolves}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Clear all solves"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="bg-gray-600 rounded-lg overflow-hidden grid grid-cols-4 gap-px">
              {/* Header */}
              <div className="p-3 text-center font-semibold bg-gray-800">#</div>
              <div className="p-3 text-center font-semibold bg-gray-800">
                Time
              </div>
              <div className="p-3 text-center font-semibold bg-gray-800">
                Ao5
              </div>
              <div className="p-3 text-center font-semibold bg-gray-800">
                Ao12
              </div>

              {/* Body */}
              {tableData.length === 0 ? (
                <div className="col-span-4 p-8 text-center text-gray-500">
                  No solves yet. Press space to start timing!
                </div>
              ) : (
                tableData.map((solve, index) => (
                  <React.Fragment key={solve.id}>
                    {/* Solve Number + Eye icon */}
                    <div
                      className="bg-gray-700 p-3 text-center cursor-pointer"
                      onClick={() => viewScramble(solve)}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{tableData.length - index}</span>
                        <Eye
                          size={14}
                          className="opacity-50 hover:opacity-100"
                        />
                      </div>
                    </div>

                    {/* Solve Time */}
                    <div className="bg-gray-700 p-3 text-center">
                      {formatTime(solve.time)}
                    </div>

                    {/* Ao5 */}
                    <div className="bg-gray-700 p-3 text-center">
                      {formatTime(solve.ao5)}
                    </div>

                    {/* Ao12 */}
                    <div className="bg-gray-700 p-3 text-center">
                      {formatTime(solve.ao12)}
                    </div>
                  </React.Fragment>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Timer */}
          <div
            className="flex-1 flex flex-col items-center justify-center min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Scramble */}
            <div className="mb-8 text-center">
              <div className="text-lg font-mono bg-gray-800 p-4 rounded-lg max-w-2xl">
                {currentScramble}
              </div>
            </div>

            {/* Timer Container with background */}
            <div className="bg-gray-800 rounded-xl p-12 mb-8 shadow-lg h-[300px] w-full max-w-2xl flex flex-col justify-center">
              {/* Touch-enabled timer area */}
              <div
                className="select-none text-center flex-1 flex flex-col justify-center"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className={`text-8xl font-mono font-bold mb-6 leading-none ${
                    isTimerActive
                      ? "text-green-600"
                      : isHoldingSpace
                      ? canStartTimer
                        ? "text-green-500"
                        : "text-red-500"
                      : "text-white"
                  }`}
                >
                  {formatTime(currentTime.toFixed(2))}
                </div>

                <div className="text-gray-400 h-6 flex items-center justify-center text-sm">
                  {!isTimerActive &&
                    !isHoldingSpace &&
                    "Hold SPACEBAR or TOUCH & HOLD to prepare, release to start"}
                  {isHoldingSpace && !canStartTimer && "Keep holding..."}
                  {isHoldingSpace && canStartTimer && "Release to start!"}
                  {isTimerActive && "Press ANY KEY or TOUCH to stop the timer"}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="flex gap-8 text-center">
              <div className="bg-gray-800 p-4 rounded-lg min-w-24">
                <div className="text-gray-400 text-sm">Best</div>
                <div className="text-2xl font-bold">
                  {formatTime(bestSingle) || "-"}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg min-w-24">
                <div className="text-gray-400 text-sm">Ao5</div>
                <div className="text-2xl font-bold">
                  {formatTime(currentAo5) || "-"}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg min-w-24">
                <div className="text-gray-400 text-sm">Ao12</div>
                <div className="text-2xl font-bold">
                  {formatTime(currentAo12) || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scramble Modal */}
        {showScrambleModal && selectedSolve && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full m-4">
              <h3 className="text-xl font-bold mb-4">Solve Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Time: </span>
                  <span className="font-bold text-2xl">
                    {formatTime(selectedSolve.time)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Scramble: </span>
                  <div className="font-mono bg-gray-700 p-2 rounded mt-1 break-all">
                    {selectedSolve.scramble}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Date: </span>
                  <span>
                    {new Date(selectedSolve.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => deleteSolve(selectedSolve.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => setShowScrambleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PracticeModePage;
