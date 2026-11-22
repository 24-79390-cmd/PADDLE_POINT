const { TZ_OFFSET } = require("./constants");

const pad = (n) => String(n).padStart(2, "0");

// "2026-11-16" + 14  ->  2:00 PM Philippine time, as a Date
function toTimestamp(date, hour) {
  return new Date(`${date}T${pad(hour)}:00:00${TZ_OFFSET}`);
}

// Date -> "YYYY-MM-DD" in Philippine time
function phDateString(d) {
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function isValidDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = toTimestamp(s, 0);
  return !Number.isNaN(d.getTime()) && phDateString(d) === s;
}

module.exports = { toTimestamp, phDateString, isValidDate };
