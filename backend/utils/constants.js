// Business rules in one place. If you change the hours here,
// also change them in frontend/src/config.js.
module.exports = {
  OPEN_HOUR: 6,          // first bookable hour (6:00 AM)
  CLOSE_HOUR: 22,        // facility closes at 10:00 PM
  MAX_DURATION: 4,       // longest single booking, in hours
  CANCEL_BEFORE_HOURS: 2, // customers can cancel until this many hours before start
  TZ_OFFSET: "+08:00",   // Philippines time
  TZ_NAME: "Asia/Manila",
  SKILL_LEVELS: ["All Levels", "Beginner", "Intermediate", "Advanced"],
  COURT_TYPES: ["Indoor", "Outdoor"],
};
