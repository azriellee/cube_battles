// src/services/metrics.js

// Library overview: This file contains all the logic for calculating the required time statistics

// Utility functions for timing calculations
export const formatTime = (time) => {
  if (!time || time === "DNF") return time;
  const timeNum = parseFloat(time);
  return timeNum.toFixed(2);
};

export const calculateAverage = (solveTimes, count) => {
  if (!solveTimes || Object.keys(solveTimes).length < count) return null;

  // Get the most recent solves based on timestamp
  const recentSolves = Object.values(solveTimes)
    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp, most recent first
    .slice(0, count) // Take the most recent 'count' solves
    .map((solve) => solve.time);

  // Count DNFs
  const dnfCount = recentSolves.filter((time) => time === "DNF").length;
  // If more than 1 DNF, the average is DNF
  if (dnfCount > 1) return "DNF";

  // Get valid times (non-DNF)
  const validTimes = recentSolves
    .filter((time) => time !== "DNF")
    .map((time) => parseFloat(time))
    .filter((time) => !isNaN(time));

  // Sort valid times
  const sortedTimes = [...validTimes].sort((a, b) => a - b);

  if (dnfCount === 0) {
    // if no DNFs, remove best and worst
    sortedTimes.shift(); // remove best
    sortedTimes.pop(); // remove worst
  } else if (dnfCount === 1) {
    // if one DNF, remove only the best, dnf would be considered the worst time
    sortedTimes.shift();
  }

  if (sortedTimes.length !== count - 2)
    throw new Error("Calculation of average went wrong");

  // Calculate average
  const sum = sortedTimes.reduce((a, b) => a + b, 0);
  const average = sum / sortedTimes.length;

  return average.toFixed(2);
};

export const getBestSingle = (solveTimes) => {
  if (!solveTimes || Object.keys(solveTimes).length === 0) return null;

  const validTimes = Object.values(solveTimes)
    .map((solve) => solve.time)
    .filter((time) => time !== "DNF")
    .map((time) => parseFloat(time))
    .filter((time) => !isNaN(time));

  if (validTimes.length === 0) return null;

  return Math.min(...validTimes).toFixed(2);
};
