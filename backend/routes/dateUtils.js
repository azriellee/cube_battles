// dateUtils.js

/**
 * Calculates the UTC date range for the previous day.
 *
 * @returns {{startOfDay: Date, endOfDay: Date}} An object containing the start and end Date objects for the previous day in UTC.
 */
const getPreviousDayDateRange = () => {
  const now = new Date(); // Get current date and time in local timezone
  const startOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      0, // Hour
      0, // Minute
      0, // Second
      0  // Millisecond
    )
  );
  // Calculate the end of the previous day in UTC (which is the start of the current day in UTC)
  const endOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(), 
      0, // Hour
      0, // Minute
      0, // Second
      0  // Millisecond
    )
  );
  return { startOfDay, endOfDay };
};

/**
 * Calculates the UTC date range for the current day.
 *
 * @returns {{startOfDay: Date, endOfDay: Date}} An object containing the start and end Date objects for the previous day in UTC.
 */
const getCurrentDayDateRange = () => {
  const now = new Date(); // Get current date and time in local timezone
  const startOfToday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, // Hour
      0, // Minute
      0, // Second
      0  // Millisecond
    )
  );
  // Calculate the end of the current day in UTC (which is the start of the next day in UTC)
  const endOfToday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, // Hour
      0, // Minute
      0, // Second
      0  // Millisecond
    )
  );
  return { startOfToday, endOfToday };
};

/**
 * Calculates the UTC start of the week for a given date.
 * Assumes Monday as the first day of the week.
 *
 * @param {Date|string} date - The input date. Can be a Date object or a string parseable by Date.
 * @returns {Date} A Date object representing the UTC start of the week (Monday at 00:00:00.000) for the given date.
 */
function getWeekStart(date) {
  const d = new Date(date); // Create a Date object from the input
  const day = d.getUTCDay(); // Get the UTC day of the week (0 for Sunday, 1 for Monday, etc.)
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
}

export { getPreviousDayDateRange, getCurrentDayDateRange, getWeekStart };