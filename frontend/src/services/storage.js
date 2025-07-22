// src/services/storage.js

// Library overview: This file contains the functions required for storage services of scrambles, solve times and statistics.

// Storage keys
const STORAGE_KEYS = {
  SCRAMBLES: "cube_battles_scrambles",
  SOLVE_TIMES: "cube_battles_solve_times",
  ROOM_DATA: "cube_battles_room_data",
  RESULTS_SUBMITTED: "cube_battles_submitted",
};

// Get today's date as a string (YYYY-MM-DD)
const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

// Get previous day's date as a string (YYYY-MM-DD)
const getPreviousDayString = () => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1
  );
  return startOfDay.toISOString().split("T")[0];
};

// Create storage key with room code and date
const createStorageKey = (baseKey, roomCode) => {
  return `${baseKey}_${roomCode}`;
};

// === SCRAMBLES STORAGE ===

/**
 *
 * Saves array of scrambles returned by the backend to local storage
 *
 * @param {string} roomCode
 * @param {Array(string)} scrambles
 */
export const saveScramblesToStorage = (roomCode, scrambles) => {
  try {
    const key = createStorageKey(STORAGE_KEYS.SCRAMBLES, roomCode);
    const data = {
      roomCode,
      date: getTodayString(),
      scrambles,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Saved ${scrambles.length} scrambles for room ${roomCode}`);
    return true;
  } catch (error) {
    console.error("Error saving scrambles to storage:", error);
    return false;
  }
};

// Get scrambles from localStorage
/**
 *
 * Returns the scrambles stored on local storage if any. Clears the local storage of scramble data that was from the previous day
 * Need to take note that this would mean scrambles are reset everyday at 12am, so should align competition timeline with this
 *
 * @param {string} roomCode
 */
export const getScramblesFromStorage = (roomCode) => {
  try {
    const key = createStorageKey(STORAGE_KEYS.SCRAMBLES, roomCode);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);

    // Check if data is from today
    if (data.date !== getTodayString()) {
      console.log("Scrambles are from a different day, removing...");
      localStorage.removeItem(key);
      return null;
    }

    return data.scrambles;
  } catch (error) {
    console.error("Error getting scrambles from storage:", error);
    return null;
  }
};

// === SOLVE TIMES STORAGE ===

// Save solve time for a specific scramble
/**
 *
 * This function saves the solve times into local storage, adding the timings for the day into an array
 *
 * @param {string} roomCode
 * @param {number} scrambleIndex - representing which sequence of scramble this corresponds to
 * @param {string} time - the solve timing
 * @param {string} scramble
 * @returns
 */
export const saveSolveTimesToStorage = (roomCode, solveTimes) => {
  try {
    const key = createStorageKey(STORAGE_KEYS.SOLVE_TIMES, roomCode);
    const solveData = {
      roomCode,
      date: getTodayString(),
      solves: solveTimes,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(solveData));
  } catch (error) {
    console.error("Error saving solve times:", error);
  }
};

// Get all solve times for a room
/**
 *
 * Returns all the solve times for the particular player of the particular room for the day
 *
 * @param {string} roomCode
 * @param {string} date
 * @returns
 */
export const getSolveTimes = (roomCode, date = getTodayString()) => {
  try {
    const key = createStorageKey(STORAGE_KEYS.SOLVE_TIMES, roomCode);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return {};
    }

    const data = JSON.parse(stored);

    // Check if data is from the requested date
    if (data.date !== date) {
      return {};
    }

    return data.solves || {};
  } catch (error) {
    console.error("Error getting solve times from storage:", error);
    return {};
  }
};

// Get solve time for a specific scramble
export const getSolveTime = (
  roomCode,
  scrambleIndex,
  date = getTodayString()
) => {
  const solveTimes = getSolveTimes(roomCode, date);
  return solveTimes[scrambleIndex] || null;
};

export const saveBestAverageToStorage = (roomCode, type, average) => {
  const data = {
    average: average,
    date: getTodayString(),
    timestamp: Date.now(),
  };
  localStorage.setItem(`best_${type}_${roomCode}`, JSON.stringify(data));
};

export const getBestAverageFromStorage = (roomCode, type) => {
  try {
    const stored = localStorage.getItem(`best_${type}_${roomCode}`);
    if (!stored) return null;

    const data = JSON.parse(stored);
    const todayDate = getTodayString();

    // Only return the average if it's from today
    if (data.date === todayDate) {
      return data.average;
    }

    return null; // Return null if it's from a different day
  } catch (error) {
    console.error("Error parsing stored average:", error);
    return null;
  }
};

/* Leaderboard Storage Functions */

export const saveDailyLeaderboardToStorage = (
  roomCode,
  dailyLeaderboardData
) => {
  localStorage.setItem(
    `daily_leaderboard_${roomCode}`,
    JSON.stringify(dailyLeaderboardData)
  );
};

export const getDailyLeaderboardFromStorage = (roomCode) => {
  try {
    const stored = localStorage.getItem(`daily_leaderboard_${roomCode}`);

    if (!stored) return null;

    const data = JSON.parse(stored);
    if (data.date === getPreviousDayString()) {
      return data.leaderboard;
    }
    return null; // Return null if it's from a different day
  } catch (error) {
    console.error("Error getting daily leaderboard from storage:", error);
    return null;
  }
};

export const saveWeeklyLeaderboardToStorage = (roomCode, leaderboardData) => {
  localStorage.setItem(
    `weekly_leaderboard_${roomCode}`,
    JSON.stringify(leaderboardData)
  );
};

export const getWeeklyLeaderboardFromStorage = (roomCode) => {
  try {
    const stored = localStorage.getItem(`weekly_leaderboard_${roomCode}`);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data;
  } catch (error) {
    console.error("Error getting daily leaderboard from storage:", error);
    return null;
  }
};

export const saveWeeklyBestStatsToStorage = (roomCode, bestStats) => {
  localStorage.setItem(
    `weekly_best_stats_${roomCode}`,
    JSON.stringify(bestStats)
  );
};

export const getWeeklyBestStatsFromStorage = (roomCode) => {
  try {
    const stored = localStorage.getItem(`weekly_best_stats_${roomCode}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error getting weekly best stats from storage:", error);
    return null;
  }
};

// === ROOM DATA STORAGE ===

// Helper function to get submission status from localStorage
export const getSubmissionStatusFromStorage = (roomCode) => {
  try {
    const key = createStorageKey(STORAGE_KEYS.RESULTS_SUBMITTED, roomCode);
    const saved = localStorage.getItem(key);

    if (!saved) {
      return false;
    }

    const savedDate = saved;
    const todayDate = getTodayString();

    return savedDate === todayDate;
  } catch (error) {
    console.error("Error loading submission status:", error);
    return false;
  }
};

// Helper function to save submission status to localStorage
export const saveSubmissionStatusToStorage = (roomCode) => {
  try {
    const todayDate = getTodayString();
    const key = createStorageKey(STORAGE_KEYS.RESULTS_SUBMITTED, roomCode);
    localStorage.setItem(key, todayDate);
  } catch (error) {
    console.error("Error saving submission status:", error);
  }
};

// Username storage functions
export const saveUsernameToStorage = (roomCode, username) => {
  localStorage.setItem(`username_${roomCode}`, username);
};

export const getUsernameFromStorage = (roomCode) => {
  return localStorage.getItem(`username_${roomCode}`);
};

// Save room data (for caching room info)
export const saveRoomData = (roomCode, roomData) => {
  try {
    const key = `${STORAGE_KEYS.ROOM_DATA}_${roomCode}`;
    const data = {
      ...roomData,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving room data:", error);
    return false;
  }
};

// Get room data
export const getRoomData = (roomCode) => {
  try {
    const key = `${STORAGE_KEYS.ROOM_DATA}_${roomCode}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Error getting room data from storage:", error);
    return null;
  }
};

// === UTILITY FUNCTIONS ===

// Clear week's data for pruning. This function would be triggered everytime the weekly competition resets and new week's competition begins
export const clearThisWeeksData = () => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);

    // Set to start of the current week (Monday 00:00)
    const day = now.getDay() || 7; // Sunday (0) should be treated as 7
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - day + 1);

    const cutoffTime = startOfWeek.getTime();

    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cube_battles_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.timestamp && data.timestamp >= cutoffTime) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // If we can't parse the data, it might be corrupted, so remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} entries from this week`);

    return keysToRemove.length;
  } catch (error) {
    console.error("Error clearing this week's data:", error);
    return 0;
  }
};

// Initialize storage (run on app startup)
export const initializeStorage = () => {
  console.log("Initializing cube battles storage...");
  clearOldData();
  const storageInfo = getStorageInfo();
  if (storageInfo) {
    console.log(
      `Storage initialized: ${storageInfo.totalKeys} keys, ${storageInfo.totalSizeKB} KB`
    );
  }
};
