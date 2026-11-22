const crypto = require("crypto");
const pool = require("../db");
const { HttpError, sendError } = require("../utils/httpError");
const { withTransaction, lockCourt } = require("../utils/tx");
const { findConflict } = require("../utils/conflicts");
const { toTimestamp, isValidDate } = require("../utils/time");
const { OPEN_HOUR, CLOSE_HOUR, MAX_DURATION, CANCEL_BEFORE_HOURS } = require("../utils/constants");

// PP-YYYYMMDD-XXXX   e.g. PP-20261116-A82F
function makeCode(date) {
  return `PP-${date.replace(/-/g, "")}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

exports.create = async (req, res) => {
  try {
    const courtId = Number(req.body.court_id);
    const date = req.body.date;
    const startHour = Number(req.body.start_hour);
    const duration = Number(req.body.duration);

    if (
      !Number.isInteger(courtId) ||
      !isValidDate(date) ||
      !Number.isInteger(startHour) ||
      !Number.isInteger(duration)
    ) {
      throw new HttpError(400, "Invalid booking details.");
    }
    if (
      startHour < OPEN_HOUR ||
      duration < 1 ||
      duration > MAX_DURATION ||
      startHour + duration > CLOSE_HOUR
    ) {
      throw new HttpError(
        400,
        `Bookings must be within ${OPEN_HOUR}:00 and ${CLOSE_HOUR}:00, up to ${MAX_DURATION} hours.`
      );
    }

    const startAt = toTimestamp(date, startHour);
    const endAt = toTimestamp(date, startHour + duration);
    if (startAt <= new Date()) throw new HttpError(400, "That time has already passed.");

    let booking = null;
    for (let attempt = 0; attempt < 5 && !booking; attempt++) {
      try {
        booking = await withTransaction(async (db) => {
          await lockCourt(db, courtId);

          const court = (await db.query("SELECT * FROM courts WHERE id = $1", [courtId])).rows[0];
          if (!court) throw new HttpError(404, "Court not found.");
          if (!court.is_available) throw new HttpError(409, "This court is currently unavailable.");

          const conflict = await findConflict(db, courtId, startAt, endAt);
          if (conflict) throw new HttpError(409, conflict);

          const total = Number(court.price_per_hour) * duration;
          const inserted = await db.query(
            `INSERT INTO bookings (booking_code, user_id, court_id, start_at, end_at, total_amount)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [makeCode(date), req.user.id, courtId, startAt, endAt, total]
          );
          return { ...inserted.rows[0], court_name: court.court_name };
        });
      } catch (err) {
        // Random code collided with an existing one: try again with a new code
        if (err.code === "23505" && err.constraint === "bookings_booking_code_key") continue;
        // Safety net from the database itself
        if (err.code === "23P01") throw new HttpError(409, "Sorry, that time was just taken.");
        throw err;
      }
    }
    if (!booking) throw new HttpError(500, "Could not generate a booking code. Please try again.");

    res.status(201).json({ booking });
  } catch (err) {
    sendError(res, err, "Could not create the booking.");
  }
};

// Only the logged-in customer's own bookings
exports.mine = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.court_name
       FROM bookings b JOIN courts c ON c.id = b.court_id
       WHERE b.user_id = $1
       ORDER BY b.start_at DESC`,
      [req.user.id]
    );
    const cutoff = Date.now() + CANCEL_BEFORE_HOURS * 3600 * 1000;
    const bookings = result.rows.map((b) => ({
      ...b,
      can_cancel:
        ["pending", "confirmed"].includes(b.status) && new Date(b.start_at).getTime() > cutoff,
    }));
    res.json({ bookings, cancel_before_hours: CANCEL_BEFORE_HOURS });
  } catch (err) {
    sendError(res, err, "Could not load your bookings.");
  }
};

exports.cancel = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid booking.");

    // user_id in the WHERE clause: customers can only touch their own bookings
    const found = await pool.query("SELECT * FROM bookings WHERE id = $1 AND user_id = $2", [
      id,
      req.user.id,
    ]);
    const booking = found.rows[0];
    if (!booking) throw new HttpError(404, "Booking not found.");
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new HttpError(400, `A ${booking.status} booking cannot be cancelled.`);
    }
    if (new Date(booking.start_at).getTime() <= Date.now() + CANCEL_BEFORE_HOURS * 3600 * 1000) {
      throw new HttpError(
        400,
        `Bookings can only be cancelled at least ${CANCEL_BEFORE_HOURS} hours before the start time.`
      );
    }

    const updated = await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
    );
    res.json({ booking: updated.rows[0] });
  } catch (err) {
    sendError(res, err, "Could not cancel the booking.");
  }
};
