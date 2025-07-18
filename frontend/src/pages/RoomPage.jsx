import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRoomScrambles,
  submitUsername,
  sendPlayerStatistics,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getWeeklyBestStats,
} from "../services/api";
import {
  saveUsernameToStorage,
  getUsernameFromStorage,
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
  saveWeeklyBestStatsToStorage,
  getWeeklyBestStatsFromStorage,
} from "../services/storage";
import {
  formatTime,
  calculateAverage,
  getBestSingle,
} from "../services/metrics";
import { getPreviousDayDateRange, getWeekStart } from "../services/dateUtils";

function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [scrambles, setScrambles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUsernamePopup, setShowUsernamePopup] = useState(false);
  const [username, setUsername] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [solveTimes, setSolveTimes] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [bestAO5, setBestAO5] = useState(null);
  const [bestAO12, setBestAO12] = useState(null);
  const [statisticsSubmitted, setStatisticsSubmitted] = useState(false);

  // Daily leaderboard states
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Weekly leaderboard states
  const [weeklyLeaderboardData, setWeeklyLeaderboardData] = useState([]);
  const [isLoadingWeeklyLeaderboard, setIsLoadingWeeklyLeaderboard] =
    useState(false);
  const [weeklyBestStats, setWeeklyBestStats] = useState(null);
  const [isLoadingWeeklyBestStats, setIsLoadingWeeklyBestStats] =
    useState(false);
  const [allWeeklyLeaderboardData, setAllWeeklyLeaderboardData] = useState([]);
  const [allWeeklyBestStats, setAllWeeklyBestStats] = useState([]);
  const [showWeeklyHistory, setShowWeeklyHistory] = useState(false);
  // const [isLoadingWeeklyHistory, setIsLoadingWeeklyHistory] = useState(false);

  // Timer states
  const [activeScramble, setActiveScramble] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHoldingSpace, setIsHoldingSpace] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);

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
      const currentWeekStart = getWeekStart(new Date());
      const currentWeekData = (response || []).filter(
        (item) =>
          new Date(item.weekStart).getTime() === currentWeekStart.getTime()
      );
      setWeeklyLeaderboardData(currentWeekData);

      // Save to local storage
      saveWeeklyLeaderboardToStorage(roomCode, response || []);
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

  const fetchWeeklyBestStats = async () => {
    if (!roomCode) return;

    setIsLoadingWeeklyBestStats(true);
    try {
      const response = await getWeeklyBestStats(roomCode);
      setAllWeeklyBestStats(response || []);

      // Filter for current week
      const currentWeekStart = getWeekStart(new Date());
      const currentWeekStats = (response || []).find(
        (item) =>
          new Date(item.weekStart).getTime() === currentWeekStart.getTime()
      );
      setWeeklyBestStats(currentWeekStats || null);

      // Save to local storage
      saveWeeklyBestStatsToStorage(roomCode, response || []);
    } catch (error) {
      console.error("Failed to fetch weekly best stats:", error);

      // Try to load from local storage as fallback
      const storedStats = getWeeklyBestStatsFromStorage(roomCode);
      if (storedStats !== null && storedStats !== undefined) {
        setAllWeeklyBestStats(storedStats);

        // Filter for current week
        const currentWeekStart = getWeekStart(new Date());
        const currentWeekStats = storedStats.find(
          (item) =>
            new Date(item.weekStart).getTime() === currentWeekStart.getTime()
        );
        setWeeklyBestStats(currentWeekStats || null);
      }
    } finally {
      setIsLoadingWeeklyBestStats(false);
    }
  };

  const generateWeeklyHistory = () => {
    // Get all unique weeks from both datasets
    const allWeeks = new Set();

    allWeeklyLeaderboardData.forEach((item) => {
      allWeeks.add(item.weekStart);
    });

    allWeeklyBestStats.forEach((item) => {
      allWeeks.add(item.weekStart);
    });

    // Convert to sorted array (most recent first)
    const sortedWeeks = Array.from(allWeeks).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    // Filter out current week for history
    const currentWeekStart = getWeekStart(new Date());
    const historicalWeeks = sortedWeeks.filter(
      (weekStart) =>
        new Date(weekStart).getTime() !== currentWeekStart.getTime()
    );

    return historicalWeeks.map((weekStart) => {
      // Find winner for this week (highest weekly points)
      const weekLeaderboard = allWeeklyLeaderboardData
        .filter((item) => item.weekStart === weekStart)
        .sort((a, b) => b.weeklyPoints - a.weeklyPoints);

      const winner = weekLeaderboard[0] || null;

      // Find best stats for this week
      const weekBestStats = allWeeklyBestStats.find(
        (item) => item.weekStart === weekStart
      );

      return {
        weekStart,
        winner,
        bestAo5: weekBestStats?.bestAo5 || null,
        bestAo5PlayerName: weekBestStats?.bestAo5PlayerName || null,
        bestAo12: weekBestStats?.bestAo12 || null,
        bestAo12PlayerName: weekBestStats?.bestAo12PlayerName || null,
        bestSolve: weekBestStats?.bestSolve || null,
        bestSolvePlayerName: weekBestStats?.bestSolvePlayerName || null,
      };
    });
  };

  const handleShowWeeklyHistory = () => {
    setShowWeeklyHistory(true);
  };

  useEffect(() => {
    if (roomCode) {
      const storedUsername = getUsernameFromStorage(roomCode);
      if (storedUsername) {
        setUsername(storedUsername);
        fetchScrambles();
        fetchDailyLeaderboard();
        fetchWeeklyLeaderboard();
        fetchWeeklyBestStats();
      } else {
        setShowUsernamePopup(true);
        setIsLoading(false);
      }
    }
  }, [roomCode]);

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
    if (statisticsSubmitted) return; // Prevent duplicate submissions

    try {
      const finalBestSingle = getBestSingle(solveTimes);
      const finalAO5 = bestAO5 || calculateAverage(solveTimes, 5);
      const finalAO12 = bestAO12 || calculateAverage(solveTimes, 12);

      await sendPlayerStatistics(
        roomCode,
        username,
        new Date().toISOString(),
        finalAO5,
        finalAO12,
        finalBestSingle
      );

      setStatisticsSubmitted(true);
      console.log("Statistics submitted successfully!");

      // Optional: Show success message to user
      // You could add a state for showing a success notification
    } catch (error) {
      console.error("Failed to submit statistics:", error);
      // Optional: Show error message to user
      // You could add error handling UI here
    }
  };

  // Function to check if all solves are completed and submit statistics
  const checkAndSubmitStatistics = (newSolveTimes) => {
    const completedCount = Object.keys(newSolveTimes).length;
    const totalScrambles = scrambles.length;

    if (
      completedCount === totalScrambles &&
      totalScrambles === 20 &&
      !statisticsSubmitted
    ) {
      submitStatistics(newSolveTimes);
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

  // Timer functionality
  const stopTimer = () => {
    const finalTime = currentTimeRef.current.toFixed(2);
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

    // Check if all solves are completed and submit statistics
    checkAndSubmitStatistics(newSolveTimes);

    const nextScrambleIndex = activeScramble + 1;

    if (nextScrambleIndex < scrambles.length) {
      // If there's a next scramble, set it as active
      setActiveScramble(nextScrambleIndex);
    } else {
      // If all scrambles are done, close the timer modal
      setActiveScramble(null);
    }
    // setCurrentTime(0);
    currentTimeRef.current = 0;
  };

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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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

    // Check if all solves are completed and submit statistics
    checkAndSubmitStatistics(newSolveTimes);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameError("");
    setIsSubmittingUsername(true);

    if (!tempUsername.trim()) {
      setUsernameError("Username cannot be empty.");
      setIsSubmittingUsername(false);
      return;
    }

    const finalUsername = tempUsername.trim();

    try {
      // Await the API call
      const result = await submitUsername(roomCode, finalUsername);

      if (result.success) {
        setUsername(finalUsername);
        saveUsernameToStorage(roomCode, finalUsername);
        setShowUsernamePopup(false);
        fetchScrambles();
        fetchDailyLeaderboard();
        fetchWeeklyLeaderboard();
        fetchWeeklyBestStats();
      } else {
        // Handle case where API returns success: false
        setUsernameError(
          result.message || "Failed to submit username. Please try again."
        );
      }
    } catch (error) {
      console.error("Submit username error:", error);

      // Handle different types of errors
      if (error.status === 409) {
        setUsernameError(
          error.message ||
            "Username is already taken. Please choose a different one."
        );
      } else if (error.status === 400) {
        setUsernameError(
          error.message || "Invalid username. Please check your input."
        );
      } else if (error.status === 500) {
        setUsernameError("Server error. Please try again in a moment.");
      } else if (
        error.name === "NetworkError" ||
        error.message === "Network Error"
      ) {
        setUsernameError(
          "Connection failed. Please check your internet connection and try again."
        );
      } else if (error.name === "TimeoutError") {
        setUsernameError("Request timed out. Please try again.");
      } else {
        // Generic error fallback
        setUsernameError(
          error.message || "Failed to submit username. Please try again later."
        );
      }
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

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
  // Daily Leaderboard popup modal
  if (showLeaderboardPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Daily Leaderboard - Room {roomCode}
            </h2>
            <p className="text-gray-600">Yesterday's top performers</p>
          </div>

          {isLoadingLeaderboard ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length > 0 ? ( // Adjusted condition
            <div className="space-y-4 mb-6">
              {leaderboardData.map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index === 0
                      ? "bg-yellow-50 border-yellow-200"
                      : index === 1
                      ? "bg-gray-50 border-gray-200"
                      : index === 2
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-4">
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
                  <div className="text-right">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-green-600">
                          {player.dailyPoints || 0}{" "}
                        </div>
                        <div className="text-gray-500">Points</div>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-600">
                          {player.bestSingle || "--:--"}
                        </div>
                        <div className="text-gray-500">Single</div>
                      </div>
                      <div>
                        <div className="font-semibold text-blue-600">
                          {player.ao5 || "--:--"}
                        </div>
                        <div className="text-gray-500">AO5</div>
                      </div>
                      <div>
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

  // Username popup modal
  if (showUsernamePopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎲</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to Room {roomCode}!
            </h2>
            <p className="text-gray-600">
              Enter your username to join the cubing battle
            </p>
          </div>

          <form onSubmit={handleUsernameSubmit}>
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  usernameError ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="Enter your username"
                maxLength={20}
                required
                autoFocus
                disabled={isSubmittingUsername}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 20 characters
              </p>

              {/* Error display */}
              {usernameError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm flex items-center">
                    <span className="mr-1">⚠️</span>
                    {usernameError}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToHome}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={isSubmittingUsername}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                disabled={!tempUsername.trim() || isSubmittingUsername}
              >
                {isSubmittingUsername ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </span>
                ) : (
                  "Join Room"
                )}
              </button>
            </div>
          </form>
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
              {/* <div className="text-center bg-indigo-100 rounded py-2">
                <div className="text-sm font-bold text-indigo-600">
                  {bestAO5 || "--:--"}
                </div>
                <div className="text-gray-600">Best AO5</div>
              </div>
              <div className="text-center bg-pink-100 rounded py-2">
                <div className="text-sm font-bold text-pink-600">
                  {bestAO12 || "--:--"}
                </div>
                <div className="text-gray-600">Best AO12</div>
              </div> */}
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

          <div className="mb-8">
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
                "Hold SPACEBAR to prepare, release to start"}
              {isHoldingSpace && !canStartTimer && "Keep holding..."}
              {isHoldingSpace && canStartTimer && "Release SPACEBAR to start!"}
              {isTimerActive && "Press ANY KEY to stop the timer"}
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLeaderboardPopup(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🏆 Daily Leaderboard
            </button>
            <button
              onClick={handleShowWeeklyHistory}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              📊 Weekly History
            </button>
            <button
              onClick={handleBackToHome}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Leave Room
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
                  • At the end of the day, your best AO5, AO12, and best solve
                  will be submitted
                </li>
                <li>
                  • Compete with others in your room for daily and weekly
                  rankings!
                </li>
              </ul>
            </div>
          )}

          {/* Completion Status */}
          {completedSolves === 20 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-green-600 text-2xl mr-3">🎉</div>
                <div>
                  <h4 className="font-semibold text-green-800">
                    Congratulations! All solves completed!
                  </h4>
                  <p className="text-sm text-green-700">
                    {statisticsSubmitted
                      ? "Your statistics have been submitted successfully!"
                      : "Submitting your statistics..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Room Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Today's Challenge
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

          {/* Scrambles List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Scrambles
            </h3>

            {scrambles.length > 0 ? (
              <div className="space-y-4">
                {scrambles.map((scramble, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="font-mono text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                        {scramble}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {solveTimes[index] ? (
                        <>
                          <button
                            onClick={() => handleDNF(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            DNF
                          </button>
                          <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm min-w-[80px] text-center">
                            {solveTimes[index].time === "DNF"
                              ? "DNF"
                              : `${formatTime(solveTimes[index].time)}s`}
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSolveClick(index)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Solve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎲</div>
                <p>No scrambles available for this room.</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Leaderboard Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Weekly Leaderboard
              </h3>
              <button
                onClick={() => {
                  fetchWeeklyLeaderboard();
                  fetchWeeklyBestStats();
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                disabled={
                  isLoadingWeeklyLeaderboard || isLoadingWeeklyBestStats
                }
              >
                {isLoadingWeeklyLeaderboard || isLoadingWeeklyBestStats
                  ? "..."
                  : "🔄"}
              </button>
            </div>

            {/* Weekly Best Stats */}
            {weeklyBestStats && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                  This Week's Best
                </h4>
                <div className="space-y-2 text-sm">
                  {weeklyBestStats.bestAo5 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best AO5:</span>
                      <span className="font-mono text-blue-600">
                        {formatTime(weeklyBestStats.bestAo5)}s (
                        {weeklyBestStats.bestAo5PlayerName})
                      </span>
                    </div>
                  )}
                  {weeklyBestStats.bestAo12 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best AO12:</span>
                      <span className="font-mono text-purple-600">
                        {formatTime(weeklyBestStats.bestAo12)}s (
                        {weeklyBestStats.bestAo12PlayerName})
                      </span>
                    </div>
                  )}
                  {weeklyBestStats.bestSolve && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Solve:</span>
                      <span className="font-mono text-green-600">
                        {formatTime(weeklyBestStats.bestSolve)}s (
                        {weeklyBestStats.bestSolvePlayerName})
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
      </div>

      {/* Weekly History Modal */}
      {showWeeklyHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Weekly History
              </h3>
              <button
                onClick={() => setShowWeeklyHistory(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {generateWeeklyHistory().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Week Start
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Winner
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Best AO5
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Best AO12
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left">
                        Best Solve
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateWeeklyHistory().map((week, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">
                          {new Date(week.weekStart).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {week.winner ? (
                            <span>
                              {week.winner.playerName} (
                              {week.winner.weeklyPoints} pts)
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {week.bestAo5 ? (
                            <span className="font-mono text-blue-600">
                              {formatTime(week.bestAo5)}s (
                              {week.bestAo5PlayerName})
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {week.bestAo12 ? (
                            <span className="font-mono text-purple-600">
                              {formatTime(week.bestAo12)}s (
                              {week.bestAo12PlayerName})
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {week.bestSolve ? (
                            <span className="font-mono text-green-600">
                              {formatTime(week.bestSolve)}s (
                              {week.bestSolvePlayerName})
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>No weekly history available yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomPage;
