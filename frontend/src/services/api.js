// src/services/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Keep the original error structure so individual functions can handle it
    return Promise.reject(error);
  }
);

/* Player data API calls */
export const createPlayer = async (playerData) => {
  try {
    const response = await api.post("/player/create-player", { playerData });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPlayerDetails = async (playerName) => {
  try {
    const response = await api.get(`/player/get-player/${playerName}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updatePlayerDetails = async (playerData) => {
  try {
    const response = await api.post(`/player/update-player-stats`, { playerData });
    return response;
  } catch (error) {
    throw error;
  }
};

/* Battle Room API calls */

// Create a new room
export const createRoom = async () => {
  try {
    const response = await api.post("/roomRoutes/create");
    return response;
  } catch (error) {
    throw error;
  }
};

// Join an existing room
export const joinRoom = async (roomCode) => {
  try {
    const response = await api.post("/roomRoutes/join", { roomCode });
    return response;
  } catch (error) {
    throw error;
  }
};

// Submit a username for the room
export const submitUsername = async (roomCode, username) => {
  try {
    const response = await api.post("/roomRoutes/submit-username", {
      roomCode,
      username,
    });
    return { success: true, data: response }; // Note: response is already .data due to interceptor
  } catch (error) {
    if (error.response) {
      // Now error.response exists because interceptor preserves original structure
      throw {
        success: false,
        status: error.response.status,
        error: error.response.data.error || "Unknown Error",
        message: error.response.data.message || "An unexpected error occurred.",
      };
    } else if (error.request) {
      // The request was made but no response was received (e.g., network error)
      throw {
        success: false,
        error: "Network Error",
        message:
          "Could not connect to the server. Please check your internet connection.",
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      throw {
        success: false,
        error: "Client Error",
        message: "An unexpected client error occurred. Please try again.",
      };
    }
  }
};

// Get scrambles for a room
export const getRoomScrambles = async (roomCode) => {
  try {
    const response = await api.get(`/roomRoutes/${roomCode}/scrambles`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Send statistics to backend
export const sendPlayerStatistics = async (
  roomCode,
  playerName,
  date,
  ao5,
  ao12,
  bestSolve
) => {
  try {
    const response = await api.post("/roomRoutes/updateStatistics", {
      roomCode,
      playerName,
      date,
      ao5,
      ao12,
      bestSolve,
    });
    return response;
  } catch (error) {
    console.error("Error sending player statistics:", error);
    throw error;
  }
};

/* Leaderboard API calls */

// Get today stats
export const getTodayStats = async (roomCode) => {
  try {
    const response = await api.get(
      `/leaderboard/today-stats/${roomCode}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// Get daily leaderboard data
export const getDailyLeaderboard = async (roomCode) => {
  try {
    const response = await api.get(
      `/leaderboard/daily-leaderboard/${roomCode}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// Get weekly leaderboard data
export const getWeeklyLeaderboard = async (roomCode) => {
  try {
    const response = await api.get(
      `/leaderboard/weekly-leaderboard/${roomCode}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// Get weekly best stats data
export const getWeeklyBestStats = async (roomCode, weekStart = null) => {
  try {
    const url = weekStart
      ? `/leaderboard/weekly-best-stats/${roomCode}?weekStart=${weekStart}`
      : `/leaderboard/weekly-best-stats/${roomCode}`;

    const response = await api.get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;
