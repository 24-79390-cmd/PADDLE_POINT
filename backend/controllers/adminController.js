const pool = require("../db");
const { HttpError, sendError } = require("../utils/httpError");
const { withTransaction, lockCourt } = require("../utils/tx");
const { findConflict } = require("../utils/conflicts");
const { toTimestamp, isValidDate } = require("../utils/time");
const C = require("../utils/constants");

const BOOKING_STATUSES = ["pending", "confirmed", "rejected", "cancelled", "completed"];

// Which status changes the admin may make
const TRANSITIONS = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["cancelled", "completed"],
};

// ---------- Dashboard ----------
exports.stats = async (req, res) => {
  try {
    const counts = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
              COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
              COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
              COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
       FROM bookings`
    );
    const customers = await pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'customer'");
    const periods = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE ts::date = now_ph::date)::int AS today,
              COUNT(*) FILTER (WHERE date_trunc('week', ts) = date_trunc('week', now_ph))::int AS week,
              COUNT(*) FILTER (WHERE date_trunc('month', ts) = date_trunc('month', now_ph))::int AS month
       FROM (SELECT start_at AT TIME ZONE 'Asia/Manila' AS ts,
                    now() AT TIME ZONE 'Asia/Manila' AS now_ph
             FROM bookings WHERE status IN ('pending', 'confirmed', 'completed')) x`
    );
    const usage = await pool.query(
      `SELECT c.id, c.court_name,
              COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_at - b.start_at)) / 3600), 0)::float AS booked_hours
       FROM courts c
       LEFT JOIN bookings b ON b.court_id = c.id
            AND b.status IN ('confirmed', 'completed')
            AND b.start_at >= now() - interval '30 days' AND b.start_at < now()
       GROUP BY c.id ORDER BY c.id`
    );
    const capacity = 30 * (C.CLOSE_HOUR - C.OPEN_HOUR);

    res.json({
      bookings: counts.rows[0],
      customers: customers.rows[0].n,
      periods: periods.rows[0],
      utilization: usage.rows.map((r) => ({
        court_name: r.court_name,
        booked_hours: Math.round(r.booked_hours * 10) / 10,
        percent: Math.round((r.booked_hours / capacity) * 1000) / 10,
      })),
    });
  } catch (err) {
    sendError(res, err, "Could not load statistics.");
  }
};

// ---------- Bookings ----------
exports.listBookings = async (req, res) => {
  try {
    const { status, q } = req.query;
    const params = [];
    const where = [];

    if (status && BOOKING_STATUSES.includes(status)) {
      params.push(status);
      where.push(`b.status = $${params.length}`);
    }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      const n = params.length;
      where.push(`(b.booking_code ILIKE $${n} OR u.full_name ILIKE $${n} OR u.email ILIKE $${n})`);
    }

    const result = await pool.query(
      `SELECT b.*, c.court_name, u.full_name, u.email, u.mobile_number
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       JOIN users u ON u.id = b.user_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY b.start_at DESC
       LIMIT 200`,
      params
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load bookings.");
  }
};

exports.setBookingStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const next = req.body.status;
    if (!Number.isInteger(id) || !BOOKING_STATUSES.includes(next)) {
      throw new HttpError(400, "Invalid request.");
    }

    const current = (await pool.query("SELECT * FROM bookings WHERE id = $1", [id])).rows[0];
    if (!current) throw new HttpError(404, "Booking not found.");

    const allowed = TRANSITIONS[current.status] || [];
    if (!allowed.includes(next)) {
      throw new HttpError(400, `A ${current.status} booking cannot be changed to ${next}.`);
    }
    if (next === "completed" && new Date(current.start_at) > new Date()) {
      throw new HttpError(400, "A booking can only be completed after its start time.");
    }

    const updated = await pool.query("UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *", [id, next]);
    res.json({ booking: updated.rows[0] });
  } catch (err) {
    sendError(res, err, "Could not update the booking.");
  }
};

// ---------- Courts (edit only: there are exactly three) ----------
exports.updateCourt = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { description, court_type, price_per_hour, image_url, is_available } = req.body;
    const price = Number(price_per_hour);

    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid court.");
    if (!C.COURT_TYPES.includes(court_type)) throw new HttpError(400, "Court type must be Indoor or Outdoor.");
    if (!Number.isFinite(price) || price < 0) throw new HttpError(400, "Price must be 0 or more.");
    if (typeof is_available !== "boolean") throw new HttpError(400, "Availability must be true or false.");
    if (image_url && !/^https?:\/\//i.test(image_url)) {
      throw new HttpError(400, "Image URL must start with http:// or https://");
    }

    const updated = await pool.query(
      `UPDATE courts SET description = $2, court_type = $3, price_per_hour = $4,
                         image_url = $5, is_available = $6
       WHERE id = $1 RETURNING *`,
      [id, (description || "").trim(), court_type, price, image_url ? image_url.trim() : null, is_available]
    );
    if (!updated.rows[0]) throw new HttpError(404, "Court not found.");
    res.json({ court: updated.rows[0] });
  } catch (err) {
    sendError(res, err, "Could not update the court.");
  }
};

// ---------- Blocked schedules ----------
exports.listBlocked = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.court_name FROM court_blocked_schedules s
       JOIN courts c ON c.id = s.court_id
       WHERE s.end_at > now() ORDER BY s.start_at`
    );
    res.json({ blocked: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load blocked schedules.");
  }
};

exports.createBlocked = async (req, res) => {
  try {
    const courtId = Number(req.body.court_id);
    const { date, reason } = req.body;
    const startHour = Number(req.body.start_hour);
    const endHour = Number(req.body.end_hour);

    if (!Number.isInteger(courtId) || !isValidDate(date) || !Number.isInteger(startHour) || !Number.isInteger(endHour)) {
      throw new HttpError(400, "Invalid details.");
    }
    if (startHour < C.OPEN_HOUR || endHour > C.CLOSE_HOUR || endHour <= startHour) {
      throw new HttpError(400, `Hours must be between ${C.OPEN_HOUR} and ${C.CLOSE_HOUR}, and end after start.`);
    }
    const startAt = toTimestamp(date, startHour);
    const endAt = toTimestamp(date, endHour);
    const range = "tstzrange($2::timestamptz, $3::timestamptz, '[)')";

    const row = await withTransaction(async (db) => {
      await lockCourt(db, courtId);
      const court = (await db.query("SELECT id FROM courts WHERE id = $1", [courtId])).rows[0];
      if (!court) throw new HttpError(404, "Court not found.");

      const bookings = await db.query(
        `SELECT COUNT(*)::int AS n FROM bookings
         WHERE court_id = $1 AND status IN ('pending', 'confirmed')
           AND tstzrange(start_at, end_at, '[)') && ${range}`,
        [courtId, startAt, endAt]
      );
      if (bookings.rows[0].n > 0) {
        throw new HttpError(409, "Active bookings exist in that time. Reject or cancel them first.");
      }
      const plays = await db.query(
        `SELECT COUNT(*)::int AS n FROM open_plays
         WHERE court_id = $1 AND status IN ('open', 'full')
           AND tstzrange(start_at, end_at, '[)') && ${range}`,
        [courtId, startAt, endAt]
      );
      if (plays.rows[0].n > 0) {
        throw new HttpError(409, "An Open Play session exists in that time. Cancel it first.");
      }

      const inserted = await db.query(
        `INSERT INTO court_blocked_schedules (court_id, start_at, end_at, reason)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [courtId, startAt, endAt, (reason || "").trim() || null]
      );
      return inserted.rows[0];
    });

    res.status(201).json({ blocked: row });
  } catch (err) {
    sendError(res, err, "Could not block that time.");
  }
};

exports.deleteBlocked = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid request.");
    const removed = await pool.query("DELETE FROM court_blocked_schedules WHERE id = $1", [id]);
    if (removed.rowCount === 0) throw new HttpError(404, "Not found.");
    res.json({ message: "Removed." });
  } catch (err) {
    sendError(res, err, "Could not remove it.");
  }
};

// ---------- Customers ----------
exports.listCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.mobile_number, u.is_active, u.created_at,
              (SELECT COUNT(*)::int FROM bookings b WHERE b.user_id = u.id) AS bookings
       FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC`
    );
    res.json({ customers: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load customers.");
  }
};

exports.setCustomerActive = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body;
    if (!Number.isInteger(id) || typeof is_active !== "boolean") throw new HttpError(400, "Invalid request.");

    const updated = await pool.query(
      `UPDATE users SET is_active = $2 WHERE id = $1 AND role = 'customer'
       RETURNING id, full_name, email, is_active`,
      [id, is_active]
    );
    if (!updated.rows[0]) throw new HttpError(404, "Customer not found.");
    res.json({ customer: updated.rows[0] });
  } catch (err) {
    sendError(res, err, "Could not update the customer.");
  }
};

// ---------- Reports ----------
exports.reports = async (req, res) => {
  try {
    const periods = { daily: ["day", 14], weekly: ["week", 12], monthly: ["month", 12] };
    const picked = periods[req.query.period || "daily"];
    if (!picked) throw new HttpError(400, "Period must be daily, weekly or monthly.");

    const result = await pool.query(
      `SELECT to_char(date_trunc($1, start_at AT TIME ZONE 'Asia/Manila'), 'YYYY-MM-DD') AS period,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
              COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*) FILTER (WHERE status IN ('cancelled', 'rejected'))::int AS cancelled,
              COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed')), 0)::float AS expected_amount
       FROM bookings
       GROUP BY 1 ORDER BY 1 DESC LIMIT $2`,
      [picked[0], picked[1]]
    );
    res.json({ period: req.query.period || "daily", rows: result.rows });
  } catch (err) {
    sendError(res, err, "Could not build the report.");
  }
};

// ---------- Open Plays ----------
function parseOpenPlay(body) {
  const title = (body.title || "").trim();
  const courtId = Number(body.court_id);
  const startHour = Number(body.start_hour);
  const endHour = Number(body.end_hour);
  const max = Number(body.max_players);
  const skill = body.skill_level || "All Levels";

  if (!title) throw new HttpError(400, "A session name is required.");
  if (!Number.isInteger(courtId)) throw new HttpError(400, "Choose a court.");
  if (!isValidDate(body.date)) throw new HttpError(400, "Choose a valid date.");
  if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) throw new HttpError(400, "Choose start and end times.");
  if (startHour < C.OPEN_HOUR || endHour > C.CLOSE_HOUR || endHour <= startHour) {
    throw new HttpError(400, `Hours must be between ${C.OPEN_HOUR} and ${C.CLOSE_HOUR}, and end after start.`);
  }
  if (!Number.isInteger(max) || max < 2 || max > 40) throw new HttpError(400, "Max players must be between 2 and 40.");
  if (!C.SKILL_LEVELS.includes(skill)) throw new HttpError(400, "Invalid skill level.");

  return {
    title,
    description: (body.description || "").trim(),
    courtId,
    skill,
    max,
    startAt: toTimestamp(body.date, startHour),
    endAt: toTimestamp(body.date, endHour),
  };
}

exports.listOpenPlays = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT op.*, c.court_name,
              (SELECT COUNT(*)::int FROM open_play_participants p WHERE p.open_play_id = op.id) AS registered
       FROM open_plays op JOIN courts c ON c.id = op.court_id
       ORDER BY op.start_at DESC LIMIT 100`
    );
    res.json({ open_plays: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load Open Plays.");
  }
};

exports.createOpenPlay = async (req, res) => {
  try {
    const p = parseOpenPlay(req.body);
    if (p.startAt <= new Date()) throw new HttpError(400, "That time has already passed.");

    const row = await withTransaction(async (db) => {
      await lockCourt(db, p.courtId);
      const court = (await db.query("SELECT id FROM courts WHERE id = $1", [p.courtId])).rows[0];
      if (!court) throw new HttpError(404, "Court not found.");

      const conflict = await findConflict(db, p.courtId, p.startAt, p.endAt);
      if (conflict) throw new HttpError(409, conflict);

      const inserted = await db.query(
        `INSERT INTO open_plays (title, description, court_id, host_id, start_at, end_at, skill_level, max_players)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [p.title, p.description, p.courtId, req.user.id, p.startAt, p.endAt, p.skill, p.max]
      );
      return inserted.rows[0];
    });

    res.status(201).json({ open_play: row });
  } catch (err) {
    sendError(res, err, "Could not create the session.");
  }
};

exports.updateOpenPlay = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid session.");
    const p = parseOpenPlay(req.body);

    const row = await withTransaction(async (db) => {
      await lockCourt(db, p.courtId);
      const current = (await db.query("SELECT * FROM open_plays WHERE id = $1 FOR UPDATE", [id])).rows[0];
      if (!current) throw new HttpError(404, "Session not found.");
      if (["cancelled", "completed"].includes(current.status)) {
        throw new HttpError(400, `A ${current.status} session cannot be edited.`);
      }

      const registered = (
        await db.query("SELECT COUNT(*)::int AS n FROM open_play_participants WHERE open_play_id = $1", [id])
      ).rows[0].n;
      if (p.max < registered) {
        throw new HttpError(400, `${registered} players already joined, so the limit cannot be below that.`);
      }

      const conflict = await findConflict(db, p.courtId, p.startAt, p.endAt, { ignoreOpenPlayId: id });
      if (conflict) throw new HttpError(409, conflict);

      const updated = await db.query(
        `UPDATE open_plays SET title = $2, description = $3, court_id = $4, start_at = $5, end_at = $6,
                skill_level = $7, max_players = $8, status = $9
         WHERE id = $1 RETURNING *`,
        [id, p.title, p.description, p.courtId, p.startAt, p.endAt, p.skill, p.max, registered >= p.max ? "full" : "open"]
      );
      return updated.rows[0];
    });

    res.json({ open_play: row });
  } catch (err) {
    sendError(res, err, "Could not update the session.");
  }
};

exports.cancelOpenPlay = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid session.");
    const updated = await pool.query(
      `UPDATE open_plays SET status = 'cancelled'
       WHERE id = $1 AND status IN ('open', 'full') RETURNING *`,
      [id]
    );
    if (!updated.rows[0]) throw new HttpError(404, "Active session not found.");
    res.json({ open_play: updated.rows[0] });
  } catch (err) {
    sendError(res, err, "Could not cancel the session.");
  }
};
