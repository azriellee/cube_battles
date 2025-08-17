import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRoomScrambles,
  sendPlayerStatistics,
  getDailyLeaderboard,
  getTodayStats,
  getWeeklyLeaderboard,
  updatePlayerDetails,
} from "../services/api";
import {
  saveScramblesToStorage,
  getScramblesFromStorage,
  saveSolveTimesToStorage,
  getSolveTimes,
  saveBestAverageToStorage,
  getBestAverageFromStorage,
  saveDailyLeaderboardToStorage,
  getDailyLeaderboardFromStorage,
  saveWeeklyLeaderboardToStorage,
  getWeeklyLeaderboardFromStorage,
  getSubmissionStatusFromStorage,
  saveSubmissionStatusToStorage,
} from "../services/storage";
import {
  formatTime,
  calculateAverage,
  getBestSingle,
} from "../services/metrics";
import { getPreviousDayDateRange, getWeekStart } from "../services/dateUtils";
import { useIsMobile } from "../services/hooks/useIsMobile";
import { useAuth } from "../services/hooks/useAuth";
import { useRoomParticipants } from "../services/hooks/useRoomParticipants";
import RoomParticipantsModals from "../components/RoomParticipantsModal";
import WeeklyBestStatsTable from "../components/WeeklyBestStatsTable";

function RoomPage() {
  const { roomCode } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scrambles, setScrambles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [solveTimes, setSolveTimes] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [bestAO5, setBestAO5] = useState(null);
  const [bestAO12, setBestAO12] = useState(null);
  const [statisticsSubmitted, setStatisticsSubmitted] = useState(() => {
    if (roomCode) {
      return getSubmissionStatusFromStorage(roomCode);
    }
    return false;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  // Room Participants states
  const roomParticipantsHook = useRoomParticipants(roomCode);

  // Daily leaderboard states
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Today's stats states
  const [showTodayStatsPopup, setShowTodayStatsPopup] = useState(false);
  const [todayStatsData, setTodayStatsData] = useState([]);
  const [isLoadingTodayStats, setIsLoadingTodayStats] = useState(false);

  // Weekly leaderboard states
  const [weeklyLeaderboardData, setWeeklyLeaderboardData] = useState([]);
  const [isLoadingWeeklyLeaderboard, setIsLoadingWeeklyLeaderboard] =
    useState(false);
  const [allWeeklyLeaderboardData, setAllWeeklyLeaderboardData] = useState([]);
  const [isNewWeek, setIsNewWeek] = useState(false);
  const [previousWeekLeaderboardData, setPreviousWeekLeaderboardData] =
    useState([]);
  const [currentWeekStats, setCurrentWeekStats] = useState(null);
  const [showWeeklyStatsModal, setShowWeeklyStatsModal] = useState(false);
  const weeklyStatsTableRef = useRef(null);

  // Timer states
  const [activeScramble, setActiveScramble] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHoldingSpace, setIsHoldingSpace] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);

  // Mobile specific states
  const isMobile = useIsMobile();
  const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false);

  // Calculate statistics
  const completedSolves = useMemo(
    () => Object.keys(solveTimes).length,
    [solveTimes]
  );
  const currentAO5 = useMemo(
    () => calculateAverage(solveTimes, 5),
    [solveTimes]
  );
  const currentAO12 = useMemo(
    () => calculateAverage(solveTimes, 12),
    [solveTimes]
  );
  const bestSingle = useMemo(() => getBestSingle(solveTimes), [solveTimes]);

  // Check if leaderboard should be shown (once per day)
  const shouldShowLeaderboard = () => {
    const todayUtc = new Date().toISOString().split("T")[0];
    const lastShownDate = localStorage.getItem(`leaderboard_shown_${roomCode}`);
    return lastShownDate !== todayUtc;
  };

  // Mark leaderboard as shown today
  const markLeaderboardAsShown = () => {
    const todayUtc = new Date().toISOString().split("T")[0];
    localStorage.setItem(`leaderboard_shown_${roomCode}`, todayUtc);
  };

  const fetchScrambles = async () => {
    setIsLoading(true);
    setError("");

    try {
      // First, try to get scrambles from local storage
      const storedScrambles = getScramblesFromStorage(roomCode);

      if (storedScrambles && storedScrambles.length > 0) {
        setScrambles(storedScrambles);
        setIsLoading(false);
        return;
      }

      // If no stored scrambles, fetch from API
      const response = await getRoomScrambles(roomCode);
      const scrambles = response.scrambles;

      if (scrambles) {
        setScrambles(scrambles);
        saveScramblesToStorage(roomCode, scrambles);
      } else {
        setError("Failed to load scrambles or no scrambles found");
      }
    } catch (err) {
      setError("Failed to load room data. Please try again.");
      console.error("Fetch scrambles error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayStats = async () => {
    if (!roomCode) return;

    setIsLoadingTodayStats(true);
    try {
      const response = await getTodayStats(roomCode);
      setTodayStatsData(response || []);
    } catch (error) {
      console.error("Failed to fetch today's stats:", error);
    } finally {
      setIsLoadingTodayStats(false);
    }
  };

  // Fetch daily leaderboard
  const fetchDailyLeaderboard = async () => {
    if (!roomCode) return;

    setIsLoadingLeaderboard(true);
    try {
      const response = await getDailyLeaderboard(roomCode);
      setLeaderboardData(response.leaderboard || []);

      // Save to local storage
      saveDailyLeaderboardToStorage(roomCode, response || []);

      // Show popup if this is the first time today
      if (shouldShowLeaderboard()) {
        setShowLeaderboardPopup(true);
        markLeaderboardAsShown();
      }
    } catch (error) {
      console.error("Failed to fetch daily leaderboard:", error);

      // Try to load from local storage as fallback
      const storedLeaderboard = getDailyLeaderboardFromStorage(roomCode);
      if (storedLeaderboard) {
        setLeaderboardData(storedLeaderboard.leaderboard || []);

        // Still show popup if it's the first time today
        if (shouldShowLeaderboard()) {
          setShowLeaderboardPopup(true);
          markLeaderboardAsShown();
        }
      }
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const fetchWeeklyLeaderboard = async () => {
    if (!roomCode) return;

    setIsLoadingWeeklyLeaderboard(true);
    try {
      const response = await getWeeklyLeaderboard(roomCode);
      setAllWeeklyLeaderboardData(response || []);

      // Filter for current week
      const today = new Date();
      const currentWeekStart = getWeekStart(today);
      const currentWeekData = (response || []).filter(
        (item) =>
          new Date(item.weekStart).getTime() === currentWeekStart.getTime()
      );
      setWeeklyLeaderboardData(currentWeekData);

      // Save to local storage
      saveWeeklyLeaderboardToStorage(roomCode, response || []);

      // check if today is the start of a new week, to display previous week's leaderboard popup
      const todayStr = today.toISOString().split("T")[0];
      const weekStartStr = currentWeekStart.toISOString().split("T")[0];
      if (todayStr === weekStartStr) {
        setIsNewWeek(true);
        const previousWeekStart = new Date(
          currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        const prevWeekData = (response || []).filter(
          (item) =>
            new Date(item.weekStart).getTime() === previousWeekStart.getTime()
        );
        setPreviousWeekLeaderboardData(prevWeekData);
      }
    } catch (error) {
      console.error("Failed to fetch weekly leaderboard:", error);

      // Try to load from local storage as fallback
      const storedLeaderboard = getWeeklyLeaderboardFromStorage(roomCode);
      if (storedLeaderboard !== null && storedLeaderboard !== undefined) {
        setAllWeeklyLeaderboardData(storedLeaderboard);

        // Filter for current week
        const currentWeekStart = getWeekStart(new Date());
        const currentWeekData = storedLeaderboard.filter(
          (item) =>
            new Date(item.weekStart).getTime() === currentWeekStart.getTime()
        );
        setWeeklyLeaderboardData(currentWeekData);
      }
    } finally {
      setIsLoadingWeeklyLeaderboard(false);
    }
  };

  const handleStatsUpdate = (currentStats) => {
    setCurrentWeekStats(currentStats);
  };

  const fetchAllData = async () => {
    fetchScrambles();
    fetchTodayStats();
    fetchDailyLeaderboard();
    fetchWeeklyLeaderboard();
  };

  // Method to refresh both leaderboard and stats
  const refreshAllWeeklyData = () => {
    fetchWeeklyLeaderboard();
    // Trigger refresh in the WeeklyBestStatsTable component
    if (weeklyStatsTableRef.current) {
      weeklyStatsTableRef.current.refresh();
    }
  };

  useEffect(() => {
    if (roomCode && currentUser?.displayName) {
      setUsername(currentUser.displayName);
      fetchAllData();
    }
  }, [roomCode, currentUser]);

  useEffect(() => {
    if (roomCode) {
      const storedSolveTimes = getSolveTimes(roomCode);
      setSolveTimes(storedSolveTimes);

      // Load best averages from storage
      const storedBestAO5 = getBestAverageFromStorage(roomCode, "ao5");
      const storedBestAO12 = getBestAverageFromStorage(roomCode, "ao12");
      setBestAO5(storedBestAO5);
      setBestAO12(storedBestAO12);
    }
  }, [roomCode]);

  // Function to submit statistics when all solves are complete
  const submitStatistics = async (solveTimes) => {
    if (statisticsSubmitted || isSubmitting) return; // prevent duplicate submissions

    setIsSubmitting(true);

    try {
      const finalBestSingle = getBestSingle(solveTimes);
      const finalAO5 = bestAO5 || calculateAverage(solveTimes, 5);
      const finalAO12 = bestAO12 || calculateAverage(solveTimes, 12);
      const totalTime = Object.values(solveTimes).reduce(
        (sum, solve) => sum + solve.time,
        0
      );

      await sendPlayerStatistics(
        roomCode,
        username,
        new Date().toISOString(),
        finalAO5,
        finalAO12,
        finalBestSingle
      );

      await updatePlayerDetails({
        playerName: username,
        numSolves: completedSolves,
        totalTime,
        bestAo5: finalAO5,
        bestAo12: finalAO12,
        bestSolve: finalBestSingle,
      });

      setStatisticsSubmitted(true);
      saveSubmissionStatusToStorage(roomCode);
      console.log("Statistics submitted successfully!");
    } catch (error) {
      console.error("Failed to submit statistics:", error);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to update best averages
  const updateBestAverages = (solveTimes) => {
    const currentAO5 = calculateAverage(solveTimes, 5);
    const currentAO12 = calculateAverage(solveTimes, 12);

    // Update best AO5
    if (currentAO5 && currentAO5 !== "DNF") {
      const currentAO5Num = parseFloat(currentAO5);
      if (
        !bestAO5 ||
        (bestAO5 !== "DNF" && currentAO5Num < parseFloat(bestAO5))
      ) {
        setBestAO5(currentAO5);
        saveBestAverageToStorage(roomCode, "ao5", currentAO5);
      }
    }

    // Update best AO12
    if (currentAO12 && currentAO12 !== "DNF") {
      const currentAO12Num = parseFloat(currentAO12);
      if (
        !bestAO12 ||
        (bestAO12 !== "DNF" && currentAO12Num < parseFloat(bestAO12))
      ) {
        setBestAO12(currentAO12);
        saveBestAverageToStorage(roomCode, "ao12", currentAO12);
      }
    }
  };

  // Function to recompute best averages from first solve onwards when DNF
  const recomputeBestAverages = (solveTimes) => {
    let curBestAo5 = null;
    let curBestAo12 = null;

    const orderedKeys = Object.keys(solveTimes)
      .map(Number)
      .sort((a, b) => a - b);

    // Calculate all possible AO5s
    for (let i = 0; i <= orderedKeys.length - 5; i++) {
      const windowKeys = orderedKeys.slice(i, i + 5);
      const windowObject = {};
      for (let key of windowKeys) {
        windowObject[key] = solveTimes[key];
      }

      const ao5 = calculateAverage(windowObject, 5);
      if (
        ao5 &&
        ao5 !== "DNF" &&
        (!curBestAo5 || parseFloat(ao5) < parseFloat(curBestAo5))
      ) {
        curBestAo5 = ao5;
      }
    }

    setBestAO5(curBestAo5);
    saveBestAverageToStorage(roomCode, "ao5", curBestAo5);

    // Calculate all possible AO12s
    for (let i = 0; i <= orderedKeys.length - 12; i++) {
      const windowKeys = orderedKeys.slice(i, i + 12);
      const windowObject = {};
      for (let key of windowKeys) {
        windowObject[key] = solveTimes[key];
      }

      const ao12 = calculateAverage(windowObject, 12);
      if (
        ao12 &&
        ao12 !== "DNF" &&
        (!curBestAo12 || parseFloat(ao12) < parseFloat(curBestAo12))
      ) {
        curBestAo12 = ao12;
      }
    }

    setBestAO12(curBestAo12);
    saveBestAverageToStorage(roomCode, "ao12", curBestAo12);
  };

  // Timer functionality
  const stopTimer = () => {
    const finalTime = Number(currentTimeRef.current.toFixed(2));
    setIsTimerActive(false);

    // Update local state
    const newSolveTimes = {
      ...solveTimes,
      [activeScramble]: {
        time: finalTime,
        scramble: scrambles[activeScramble],
        timestamp: Date.now(),
      },
    };

    setSolveTimes(newSolveTimes);
    saveSolveTimesToStorage(roomCode, newSolveTimes);
    // Update best averages
    updateBestAverages(newSolveTimes);

    const nextScrambleIndex = activeScramble + 1;

    if (nextScrambleIndex < scrambles.length) {
      // If there's a next scramble, set it as active
      setActiveScramble(nextScrambleIndex);
    } else {
      // If all scrambles are done, close the timer modal
      setActiveScramble(null);
    }

    if (
      completedSolves + 1 === 20 &&
      !statisticsSubmitted &&
      !showCompletionPopup
    ) {
      setShowCompletionPopup(true);
    }
    currentTimeRef.current = 0;
  };

  // Touch handlers for mobile devies
  const handleTouchStart = useCallback(
    (event) => {
      if (activeScramble === null) return;

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
    [activeScramble, isTimerActive, isHoldingSpace]
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (activeScramble === null) return;

      if (isHoldingSpace || isTimerActive) {
        event.preventDefault();
      }

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
    [activeScramble, isHoldingSpace, isTimerActive, canStartTimer]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (activeScramble === null) return;

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
    [activeScramble, isTimerActive, isHoldingSpace]
  );

  const handleKeyUp = useCallback(
    (event) => {
      if (activeScramble === null) return;

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
    [activeScramble, isHoldingSpace, isTimerActive, canStartTimer]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Only keyboard events on document, touch events are handled by specific elements
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Prevent accidental pull-to-refresh only when timer modal is active
  useEffect(() => {
    // Only add event listeners when the timer modal is active
    if (activeScramble === null) {
      return; // Exit early if modal is not active
    }

    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const touchDeltaY = touchY - touchStartY;
      const touchDuration = Date.now() - touchStartTime;

      // Prevent pull-to-refresh when modal is active and:
      // 1. At the top of the page (scrollY <= 5 for some tolerance)
      // 2. Pulling down (touchDeltaY > 5)
      // 3. Any movement that could trigger refresh
      // This is more aggressive to prevent refresh during timer interactions
      if (scrollY <= 5 && touchDeltaY > 5) {
        e.preventDefault();
      }

      // Also prevent if user is holding space/timer and dragging
      if ((isHoldingSpace || isTimerActive) && touchDeltaY > 0) {
        e.preventDefault();
      }
    };

    // Use non-passive listeners for both to enable preventDefault
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [activeScramble, isHoldingSpace, isTimerActive]);

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

  const currentTimeRef = useRef(0);
  // Timer update effect
  useEffect(() => {
    let interval;
    let startTime;
    if (isTimerActive) {
      startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        currentTimeRef.current = elapsed; // Update ref
        setCurrentTime(elapsed); // Update state for display
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const handleSolveClick = (index) => {
    if (isTimerActive) return;
    setActiveScramble(index);
    setCurrentTime(0);
    currentTimeRef.current = 0;
  };

  const handleDNF = (index) => {
    const newSolveTimes = {
      ...solveTimes,
      [index]: {
        time: "DNF",
        scramble: scrambles[index],
        timestamp: solveTimes[index].timestamp,
      },
    };
    setSolveTimes(newSolveTimes);
    saveSolveTimesToStorage(roomCode, newSolveTimes);
    // Recompute best averages
    recomputeBestAverages(newSolveTimes);
  };

  const handleBackToHome = () => {
    navigate("/battles-home");
  };

  // Daily Leaderboard popup modal
  if (showLeaderboardPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Daily Leaderboard - Room {roomCode}
            </h2>
            <p className="text-gray-600">Yesterday's top performers</p>
          </div>

          {isLoadingLeaderboard ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length > 0 ? (
            <div className="space-y-4 mb-6">
              {leaderboardData.map((player, index) => (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border ${
                    index === 0
                      ? "bg-yellow-50 border-yellow-200"
                      : index === 1
                      ? "bg-gray-50 border-gray-200"
                      : index === 2
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-500 text-white"
                          : index === 2
                          ? "bg-orange-500 text-white"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {player.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        {player.date &&
                          new Date(player.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {player.dailyPoints || 0}
                        </div>
                        <div className="text-gray-500">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">
                          {player.bestSingle || "--:--"}
                        </div>
                        <div className="text-gray-500">Single</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">
                          {player.ao5 || "--:--"}
                        </div>
                        <div className="text-gray-500">AO5</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">
                          {player.ao12 || "--:--"}
                        </div>
                        <div className="text-gray-500">AO12</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No leaderboard data available yet.</p>
              <p className="text-sm mt-2">
                Complete some solves to see rankings!
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => setShowLeaderboardPopup(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Continue to Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Previous week leaderboard popup modal
  // Weekly Leaderboard popup modal
  if (isNewWeek && previousWeekLeaderboardData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Last Week’s Results
            </h2>
            <p className="text-gray-600">
              Room {roomCode} — Weekly Top Performers
            </p>
          </div>

          {previousWeekLeaderboardData.length > 0 ? (
            <div className="space-y-4 mb-6">
              <p className="text-green-600 font-medium text-sm mb-4">
                🎉 Congratulations{" "}
                <span className="font-semibold">
                  {previousWeekLeaderboardData[0].playerName}
                </span>{" "}
                for topping the leaderboard!
              </p>
              {previousWeekLeaderboardData.map((player, index) => (
                <div
                  key={`${player.roomCode}-${player.playerName}`}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border ${
                    index === 0
                      ? "bg-yellow-50 border-yellow-200"
                      : index === 1
                      ? "bg-gray-50 border-gray-200"
                      : index === 2
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-500 text-white"
                          : index === 2
                          ? "bg-orange-500 text-white"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {player.playerName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {player.weekStart &&
                          new Date(player.weekStart).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {player.weeklyPoints || 0}
                        </div>
                        <div className="text-gray-500">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">
                          {player.bestSingle || "--:--"}
                        </div>
                        <div className="text-gray-500">Single</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">
                          {player.ao5 || "--:--"}
                        </div>
                        <div className="text-gray-500">AO5</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">
                          {player.ao12 || "--:--"}
                        </div>
                        <div className="text-gray-500">AO12</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No weekly leaderboard data found.</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => setIsNewWeek(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Continue to Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Timer popup modal
  if (activeScramble !== null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl mx-4 text-center">
          {/* Stats bar */}
          <div className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="text-center bg-orange-100 rounded py-2">
                <div className="text-sm font-bold text-orange-600">
                  {bestSingle || "--:--"}
                </div>
                <div className="text-gray-600">Best</div>
              </div>
              <div className="text-center bg-blue-100 rounded py-2">
                <div className="text-sm font-bold text-blue-600">
                  {currentAO5 || "--:--"}
                </div>
                <div className="text-gray-600">Current AO5</div>
              </div>
              <div className="text-center bg-purple-100 rounded py-2">
                <div className="text-sm font-bold text-purple-600">
                  {currentAO12 || "--:--"}
                </div>
                <div className="text-gray-600">Current AO12</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Scramble {activeScramble + 1}
            </h2>
            <div className="font-mono text-lg text-gray-700 bg-gray-100 px-4 py-2 rounded mb-6">
              {scrambles[activeScramble]}
            </div>
          </div>

          {/* Touch-enabled timer area */}
          <div
            className="mb-8 select-none"
            style={{
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none", // ← blocks the Samsung long-press menu
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`text-7xl font-mono font-bold mb-4 ${
                isTimerActive
                  ? "text-green-600"
                  : isHoldingSpace
                  ? canStartTimer
                    ? "text-green-500"
                    : "text-red-500"
                  : "text-gray-800"
              }`}
            >
              {formatTime(currentTime.toFixed(2))}
            </div>

            <div className="text-gray-600 mb-4">
              {!isTimerActive &&
                !isHoldingSpace &&
                "Hold SPACEBAR or TOUCH & HOLD to prepare, release to start"}
              {isHoldingSpace && !canStartTimer && "Keep holding..."}
              {isHoldingSpace && canStartTimer && "Release to start!"}
              {isTimerActive && "Press ANY KEY or TOUCH to stop the timer"}
            </div>
          </div>

          <button
            onClick={() => setActiveScramble(null)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg"
            disabled={isTimerActive}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Completion popup modal
  const CompletionPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          {/* Success icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title and message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Congratulations! 🎉
          </h3>
          <p className="text-gray-600 mb-6">
            You've completed all 20 solves! Would you like to submit your
            results now?
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => {
                setShowCompletionPopup(false);
                submitStatistics(solveTimes);
              }}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Results"}
            </button>

            <button
              onClick={() => setShowCompletionPopup(false)}
              disabled={isSubmitting}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Not Now
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            You can submit your results later using the button below
          </p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToHome}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gray-100 text-sm sm:text-base">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left Section: Logo + Room Info */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <img
              src="/logo.png"
              alt="Speedcube Battles Logo"
              className="w-12 h-12"
            />

            {/* Room Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Room: {roomCode}
              </h1>
              <p className="text-gray-600">
                Welcome,{" "}
                <span className="font-semibold text-blue-600">{username}</span>!
                Ready to battle! 🎲
              </p>
            </div>
          </div>

          {/* Right Section: Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowLeaderboardPopup(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🏆 Daily Leaderboard
            </button>
            <button
              onClick={() => setShowWeeklyStatsModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              📊 Weekly History
            </button>
            {isMobile && (
              <button
                onClick={() => setShowMobileLeaderboard(true)}
                className="bg-blue-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🏆 Weekly Leaderboard
              </button>
            )}
            <button
              onClick={roomParticipantsHook.handleShowRoomParticipants}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              👥 Room Participants
            </button>
            <button
              onClick={handleBackToHome}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Instructions */}
          {showInstructions && (
            <div className="relative mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              {/* Close button */}
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                aria-label="Close instructions"
              >
                ✕
              </button>

              <h4 className="font-semibold text-blue-800 mb-2">How to Play:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • Complete all 20 scrambles at your own pace within the day
                </li>
                <li>
                  • Click "Solve" to open the timer, hold SPACEBAR to prepare,
                  release to start
                </li>
                <li>• Press any key to stop the timer</li>
                <li>
                  • Your solve times are automatically saved in your browser
                </li>
                <li>
                  • After you are done solving, click "Submit Statistics" to
                  submit your times. This can be submitted at anytime even
                  before 20 solves are completed.
                </li>
                <li>
                  • Compete with others in your room for daily and weekly
                  rankings!
                </li>
              </ul>
            </div>
          )}

          {/* Completion Status */}
          {statisticsSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-green-600 text-2xl mr-3">🎉</div>
                <div>
                  <h4 className="font-semibold text-green-800">
                    {completedSolves === 20
                      ? "Congratulations! All solves completed!"
                      : "Submission received!"}
                  </h4>
                  <p className="text-sm text-green-700">
                    Your statistics have been submitted successfully!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Room Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Today's Challenge
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTodayStatsPopup(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  👥 View Opponents
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {completedSolves}/20
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {bestSingle || "--:--"}
                </div>
                <div className="text-sm text-gray-600">Best Single</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentAO5 || "--:--"}
                </div>
                <div className="text-sm text-gray-600">Current AO5</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {currentAO12 || "--:--"}
                </div>
                <div className="text-sm text-gray-600">Current AO12</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {bestAO5 || "--:--"}
                </div>
                <div className="text-sm text-gray-600">Best AO5</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">
                  {bestAO12 || "--:--"}
                </div>
                <div className="text-sm text-gray-600">Best AO12</div>
              </div>
            </div>
          </div>

          {/* Show popup of today's stats for the room */}
          {showTodayStatsPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-sm sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                      👥 Opponents
                    </h3>
                    <button
                      onClick={() => setShowTodayStatsPopup(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl sm:hidden"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                    <button
                      onClick={fetchTodayStats}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      title="Refresh Stats"
                    >
                      🔄 <span className="sm:inline">Refresh</span>
                    </button>
                    <button
                      onClick={() => setShowTodayStatsPopup(false)}
                      className="hidden sm:flex bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors items-center gap-2"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-80px)]">
                  {isLoadingTodayStats ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
                        Loading stats...
                      </div>
                    </div>
                  ) : todayStatsData.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-lg mb-2">🎯</div>
                      <p className="text-gray-600 text-sm sm:text-base">
                        No opponent data yet.
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Be the first to submit!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="block sm:hidden space-y-3">
                        {todayStatsData.map((player, index) => (
                          <div
                            key={index}
                            className={`rounded-lg border p-3 ${
                              player.playerName === username
                                ? "bg-blue-50 border-blue-200"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {player.playerName === username && (
                                <span className="text-blue-500">👤</span>
                              )}
                              <span
                                className={`font-medium text-sm ${
                                  player.playerName === username
                                    ? "text-blue-600"
                                    : "text-gray-800"
                                }`}
                              >
                                {player.playerName}
                              </span>
                              {player.playerName === username && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">Best</div>
                                <div
                                  className={`font-mono font-semibold ${
                                    player.bestSolve &&
                                    player.bestSolve !== "--"
                                      ? "text-green-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {player.bestSolve ?? "--:--"}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">AO5</div>
                                <div
                                  className={`font-mono font-semibold ${
                                    player.ao5 && player.ao5 !== "--"
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {player.ao5 ?? "--:--"}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">AO12</div>
                                <div
                                  className={`font-mono font-semibold ${
                                    player.ao12 && player.ao12 !== "--"
                                      ? "text-purple-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {player.ao12 ?? "--:--"}
                                </div>
                              </div>
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
                                Player
                              </th>
                              <th className="py-3 px-4 text-right font-semibold text-gray-800">
                                Best Single
                              </th>
                              <th className="py-3 px-4 text-right font-semibold text-gray-800">
                                AO5
                              </th>
                              <th className="py-3 px-4 text-right font-semibold text-gray-800">
                                AO12
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {todayStatsData.map((player, index) => (
                              <tr
                                key={index}
                                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                  player.playerName === username
                                    ? "bg-blue-50 border-blue-200"
                                    : ""
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {player.playerName === username && (
                                      <span className="text-blue-500">👤</span>
                                    )}
                                    <span
                                      className={`font-medium ${
                                        player.playerName === username
                                          ? "text-blue-600"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {player.playerName}
                                    </span>
                                    {player.playerName === username && (
                                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                  <span
                                    className={`${
                                      player.bestSolve &&
                                      player.bestSolve !== "--"
                                        ? "text-green-600 font-semibold"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {player.bestSolve ?? "--:--"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                  <span
                                    className={`${
                                      player.ao5 && player.ao5 !== "--"
                                        ? "text-blue-600 font-semibold"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {player.ao5 ?? "--:--"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                  <span
                                    className={`${
                                      player.ao12 && player.ao12 !== "--"
                                        ? "text-purple-600 font-semibold"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {player.ao12 ?? "--:--"}
                                  </span>
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

          {/* Scrambles List */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Scrambles
            </h3>

            {scrambles.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {scrambles.map((scramble, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Header with number and action */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          Scramble {index + 1}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        {solveTimes[index] ? (
                          <>
                            <button
                              onClick={() => handleDNF(index)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              DNF
                            </button>
                            <div className="bg-green-100 text-green-800 px-2 py-1 sm:px-4 sm:py-2 rounded font-mono text-xs sm:text-sm font-medium min-w-[60px] sm:min-w-[80px] text-center">
                              {solveTimes[index].time === "DNF"
                                ? "DNF"
                                : `${formatTime(solveTimes[index].time)}s`}
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSolveClick(index)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded font-medium transition-colors text-sm"
                          >
                            Solve
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scramble content - full width */}
                    <div className="p-3 sm:p-4">
                      <div className="font-mono text-sm text-gray-700 bg-gray-50 px-3 py-3 rounded leading-relaxed break-all">
                        {scramble}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎲</div>
                <p className="text-sm sm:text-base">
                  No scrambles available for this room.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (completedSolves !== 20) {
                const confirmed = window.confirm(
                  `You have only completed ${completedSolves} out of 20 solves.\nAre you sure you want to submit your results?`
                );
                if (!confirmed) return;
              }
              submitStatistics(solveTimes);
            }}
            className={`mt-6 w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              !statisticsSubmitted && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={statisticsSubmitted || isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : statisticsSubmitted
              ? "Results Submitted"
              : "Submit Results"}
          </button>
        </div>

        {/* Weekly Leaderboard Sidebar */}
        {!isMobile && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Weekly Leaderboard
                </h3>
                <button
                  onClick={refreshAllWeeklyData}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  disabled={isLoadingWeeklyLeaderboard}
                >
                  {isLoadingWeeklyLeaderboard ? (
                    "..."
                  ) : (
                    <span className="text-2xl">🔄</span>
                  )}
                </button>
              </div>

              {/* Weekly Best Stats */}
              {currentWeekStats && currentWeekStats.summary && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                    This Week's Best
                  </h4>
                  <div className="space-y-2 text-sm">
                    {currentWeekStats.summary.bestAo5 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best AO5:</span>
                        <span className="font-mono text-blue-600">
                          {formatTime(
                            currentWeekStats.summary.bestAo5.solveTime
                          )}
                          s ({currentWeekStats.summary.bestAo5.playerName})
                        </span>
                      </div>
                    )}
                    {currentWeekStats.summary.bestAo12 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best AO12:</span>
                        <span className="font-mono text-purple-600">
                          {formatTime(
                            currentWeekStats.summary.bestAo12.solveTime
                          )}
                          s ({currentWeekStats.summary.bestAo12.playerName})
                        </span>
                      </div>
                    )}
                    {currentWeekStats.summary.bestSolve && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Solve:</span>
                        <span className="font-mono text-green-600">
                          {formatTime(
                            currentWeekStats.summary.bestSolve.solveTime
                          )}
                          s ({currentWeekStats.summary.bestSolve.playerName})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoadingWeeklyLeaderboard ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              ) : weeklyLeaderboardData.length > 0 ? (
                <div className="space-y-3">
                  {weeklyLeaderboardData.map((player, index) => (
                    <div
                      key={`${player.roomCode}-${player.playerName}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0
                          ? "bg-yellow-50 border-yellow-200"
                          : index === 1
                          ? "bg-gray-50 border-gray-200"
                          : index === 2
                          ? "bg-orange-50 border-orange-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                              ? "bg-gray-500 text-white"
                              : index === 2
                              ? "bg-orange-500 text-white"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {player.playerName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {player.weeklyPoints}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm">No weekly rankings yet</p>
                  <p className="text-xs mt-1">
                    Complete daily challenges to earn points!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Stats Modal */}
      {showWeeklyStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                Weekly Best Stats
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshAllWeeklyData}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "..." : <span className="text-2xl">🔄</span>}
                </button>
                <button
                  onClick={() => setShowWeeklyStatsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <WeeklyBestStatsTable
                ref={weeklyStatsTableRef}
                roomCode={roomCode}
                formatTime={formatTime}
                getWeekStart={getWeekStart}
                onStatsUpdate={handleStatsUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {isMobile && showMobileLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowMobileLeaderboard(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>

            {/* Modal Content */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Weekly Leaderboard
            </h3>

            {/* Refresh Button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => {
                  refreshAllWeeklyData();
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                disabled={isLoadingWeeklyLeaderboard}
              >
                {isLoadingWeeklyLeaderboard ? (
                  "..."
                ) : (
                  <span className="text-2xl">🔄</span>
                )}
              </button>
            </div>
            {currentWeekStats && currentWeekStats.summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                  This Week's Best
                </h4>
                <div className="space-y-2 text-sm">
                  {currentWeekStats.summary.bestAo5 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best AO5:</span>
                      <span className="font-mono text-blue-600">
                        {formatTime(currentWeekStats.summary.bestAo5.solveTime)}
                        s ({currentWeekStats.summary.bestAo5.playerName})
                      </span>
                    </div>
                  )}
                  {currentWeekStats.summary.bestAo12 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best AO12:</span>
                      <span className="font-mono text-purple-600">
                        {formatTime(
                          currentWeekStats.summary.bestAo12.solveTime
                        )}
                        s ({currentWeekStats.summary.bestAo12.playerName})
                      </span>
                    </div>
                  )}
                  {currentWeekStats.summary.bestSolve && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Solve:</span>
                      <span className="font-mono text-green-600">
                        {formatTime(
                          currentWeekStats.summary.bestSolve.solveTime
                        )}
                        s ({currentWeekStats.summary.bestSolve.playerName})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLoadingWeeklyLeaderboard ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            ) : weeklyLeaderboardData.length > 0 ? (
              <div className="space-y-3">
                {weeklyLeaderboardData.map((player, index) => (
                  <div
                    key={`${player.roomCode}-${player.playerName}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index === 0
                        ? "bg-yellow-50 border-yellow-200"
                        : index === 1
                        ? "bg-gray-50 border-gray-200"
                        : index === 2
                        ? "bg-orange-50 border-orange-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                            ? "bg-gray-500 text-white"
                            : index === 2
                            ? "bg-orange-500 text-white"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {player.playerName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {player.weeklyPoints}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm">No weekly rankings yet</p>
                <p className="text-xs mt-1">
                  Complete daily challenges to earn points!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion popup modal */}
      {showCompletionPopup && <CompletionPopup />}
      <RoomParticipantsModals
        // States
        showRoomParticipants={roomParticipantsHook.showRoomParticipants}
        roomParticipants={roomParticipantsHook.roomParticipants}
        isLoadingParticipants={roomParticipantsHook.isLoadingParticipants}
        selectedPlayerDetails={roomParticipantsHook.selectedPlayerDetails}
        showPlayerProfile={roomParticipantsHook.showPlayerProfile}
        isLoadingPlayerDetails={roomParticipantsHook.isLoadingPlayerDetails}
        // Actions
        fetchRoomParticipants={roomParticipantsHook.fetchRoomParticipants}
        handleViewPlayerProfile={roomParticipantsHook.handleViewPlayerProfile}
        closeRoomParticipants={roomParticipantsHook.closeRoomParticipants}
        closePlayerProfile={roomParticipantsHook.closePlayerProfile}
        // Props
        roomCode={roomCode}
        username={username}
      />
    </div>
  );
}

export default RoomPage;
