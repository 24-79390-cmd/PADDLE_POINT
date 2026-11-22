// Returns a human-readable reason if [startAt, endAt) clashes with something
// on this court, or null if the time is free.
// Checks: admin-blocked times, Open Play sessions, pending/confirmed bookings.
async function findConflict(db, courtId, startAt, endAt, opts = {}) {
  const ignoreOpenPlayId = opts.ignoreOpenPlayId || null;
  const range = "tstzrange($2::timestamptz, $3::timestamptz, '[)')";

  const blocked = await db.query(
    `SELECT reason FROM court_blocked_schedules
     WHERE court_id = $1 AND tstzrange(start_at, end_at, '[)') && ${range}
     LIMIT 1`,
    [courtId, startAt, endAt]
  );
  if (blocked.rows.length) {
    const why = blocked.rows[0].reason ? ` (${blocked.rows[0].reason})` : "";
    return `That time is blocked by PADDLE POINT${why}.`;
  }

  const play = await db.query(
    `SELECT title FROM open_plays
     WHERE court_id = $1 AND status IN ('open', 'full')
       AND tstzrange(start_at, end_at, '[)') && ${range}
       AND ($4::int IS NULL OR id <> $4::int)
     LIMIT 1`,
    [courtId, startAt, endAt, ignoreOpenPlayId]
  );
  if (play.rows.length) {
    return `That time is used by the Open Play session "${play.rows[0].title}".`;
  }

  const booking = await db.query(
    `SELECT 1 FROM bookings
     WHERE court_id = $1 AND status IN ('pending', 'confirmed')
       AND tstzrange(start_at, end_at, '[)') && ${range}
     LIMIT 1`,
    [courtId, startAt, endAt]
  );
  if (booking.rows.length) return "That time is already booked.";

  return null;
}

module.exports = { findConflict };
