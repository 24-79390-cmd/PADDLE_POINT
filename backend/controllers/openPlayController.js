const pool = require("../db");
const { HttpError, sendError } = require("../utils/httpError");
const { withTransaction } = require("../utils/tx");

const SELECT_PLAYS = `
  SELECT op.id, op.title, op.description, op.court_id, c.court_name,
         op.start_at, op.end_at, op.skill_level, op.max_players, op.status,
         (SELECT COUNT(*)::int FROM open_play_participants p WHERE p.open_play_id = op.id) AS registered,
         EXISTS (SELECT 1 FROM open_play_participants p
                 WHERE p.open_play_id = op.id AND p.user_id = $1::int) AS joined
  FROM open_plays op
  JOIN courts c ON c.id = op.court_id`;

// Public list of upcoming sessions (shows "joined" when logged in)
exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_PLAYS}
       WHERE op.status IN ('open', 'full') AND op.end_at > now()
       ORDER BY op.start_at`,
      [req.user ? req.user.id : null]
    );
    res.json({ open_plays: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load Open Plays.");
  }
};

// Sessions the logged-in customer has joined
exports.mine = async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_PLAYS}
       WHERE op.id IN (SELECT open_play_id FROM open_play_participants WHERE user_id = $1::int)
       ORDER BY op.start_at DESC`,
      [req.user.id]
    );
    res.json({ open_plays: result.rows });
  } catch (err) {
    sendError(res, err, "Could not load your Open Plays.");
  }
};

exports.join = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid session.");

    await withTransaction(async (db) => {
      // Lock this session row so two people can't take the last spot together
      const play = (await db.query("SELECT * FROM open_plays WHERE id = $1 FOR UPDATE", [id])).rows[0];
      if (!play) throw new HttpError(404, "Session not found.");
      if (play.status === "cancelled") throw new HttpError(400, "This session was cancelled.");
      if (play.status === "completed" || new Date(play.start_at) <= new Date()) {
        throw new HttpError(400, "This session has already started.");
      }

      const count = (
        await db.query("SELECT COUNT(*)::int AS n FROM open_play_participants WHERE open_play_id = $1", [id])
      ).rows[0].n;
      if (count >= play.max_players) throw new HttpError(409, "This session is full.");

      const inserted = await db.query(
        `INSERT INTO open_play_participants (open_play_id, user_id)
         VALUES ($1, $2) ON CONFLICT (open_play_id, user_id) DO NOTHING`,
        [id, req.user.id]
      );
      if (inserted.rowCount === 0) throw new HttpError(409, "You already joined this session.");

      if (count + 1 >= play.max_players) {
        await db.query("UPDATE open_plays SET status = 'full' WHERE id = $1", [id]);
      }
    });

    res.status(201).json({ message: "You joined the session." });
  } catch (err) {
    sendError(res, err, "Could not join the session.");
  }
};

exports.leave = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid session.");

    await withTransaction(async (db) => {
      const play = (await db.query("SELECT * FROM open_plays WHERE id = $1 FOR UPDATE", [id])).rows[0];
      if (!play) throw new HttpError(404, "Session not found.");
      if (new Date(play.start_at) <= new Date()) {
        throw new HttpError(400, "This session has already started.");
      }

      const removed = await db.query(
        "DELETE FROM open_play_participants WHERE open_play_id = $1 AND user_id = $2",
        [id, req.user.id]
      );
      if (removed.rowCount === 0) throw new HttpError(404, "You are not in this session.");

      if (play.status === "full") {
        await db.query("UPDATE open_plays SET status = 'open' WHERE id = $1", [id]);
      }
    });

    res.json({ message: "You left the session." });
  } catch (err) {
    sendError(res, err, "Could not leave the session.");
  }
};
