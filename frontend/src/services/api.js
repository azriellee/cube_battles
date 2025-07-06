// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api/roomRoutes";

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

// Create a new room
export const createRoom = async () => {
  try {
    const response = await api.post("/create");
    return response;
  } catch (error) {
    throw error;
  }
};

// Join an existing room
export const joinRoom = async (roomCode) => {
  try {
    const response = await api.post("/join", { roomCode });
    return response;
  } catch (error) {
    throw error;
  }
};

// Submit a username for the room
export const submitUsername = async (roomCode, username) => {
  try {
    const response = await api.post("/submit-username", { roomCode, username });
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
    const response = await api.get(`/${roomCode}/scrambles`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get daily leaderboard data
export const getDailyLeaderboard = async (roomCode) => {
  try {
    const response = await api.get(`/${roomCode}/daily-leaderboard`);
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
    const response = await api.post("/updateStatistics", {
      roomCode,
      playerName,
      date: date instanceof Date ? date.toISOString() : date,
      ao5,
      ao12,
      bestSolve,
    });
    return response; // Note: already .data due to interceptor
  } catch (error) {
    console.error("Error sending player statistics:", error);
    throw error;
  }
};

export default api;
