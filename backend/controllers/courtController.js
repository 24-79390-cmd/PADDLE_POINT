const pool = require("../db");
const { sendError, HttpError } = require("../utils/httpError");
const { toTimestamp, isValidDate } = require("../utils/time");
const { OPEN_HOUR, CLOSE_HOUR } = require("../utils/constants");

exports.list = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courts ORDER BY id");
    res.json({ courts: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load courts.");
  }
};

// Hour-by-hour availability of one court on one date
exports.availability = async (req, res) => {
  try {
    const courtId = Number(req.params.id);
    const { date } = req.query;
    if (!Number.isInteger(courtId) || !isValidDate(date)) {
      throw new HttpError(400, "A valid court and date (YYYY-MM-DD) are required.");
    }

    const court = (await pool.query("SELECT * FROM courts WHERE id = $1", [courtId])).rows[0];
    if (!court) throw new HttpError(404, "Court not found.");

    const dayStart = toTimestamp(date, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

    const busy = await pool.query(
      `SELECT start_at, end_at FROM bookings
         WHERE court_id = $1 AND status IN ('pending', 'confirmed')
           AND start_at < $3 AND end_at > $2
       UNION ALL
       SELECT start_at, end_at FROM court_blocked_schedules
         WHERE court_id = $1 AND start_at < $3 AND end_at > $2
       UNION ALL
       SELECT start_at, end_at FROM open_plays
         WHERE court_id = $1 AND status IN ('open', 'full')
           AND start_at < $3 AND end_at > $2`,
      [courtId, dayStart, dayEnd]
    );

    const now = new Date();
    const slots = [];
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      const s = toTimestamp(date, hour);
      const e = toTimestamp(date, hour + 1);
      const taken = busy.rows.some((b) => new Date(b.start_at) < e && new Date(b.end_at) > s);
      slots.push({ hour, available: court.is_available && !taken && s > now });
    }

    res.json({
      court_id: courtId,
      date,
      is_available: court.is_available,
      open_hour: OPEN_HOUR,
      close_hour: CLOSE_HOUR,
      slots,
    });
  } catch (err) {
    sendError(res, err, "Could not load availability.");
  }
};
