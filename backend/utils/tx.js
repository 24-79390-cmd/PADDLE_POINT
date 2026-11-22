const pool = require("../db");

// Run fn(client) inside a database transaction.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

// Serialises all writes for one court, so two people can never
// pass the conflict check for the same slot at the same moment.
function lockCourt(client, courtId) {
  return client.query("SELECT pg_advisory_xact_lock($1)", [courtId]);
}

module.exports = { withTransaction, lockCourt };
