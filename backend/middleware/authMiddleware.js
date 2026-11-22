const jwt = require("jsonwebtoken");
const pool = require("../db");

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Verifies the token, then loads the user's CURRENT role and status from
// PostgreSQL. The role is never taken from the request or trusted from the token.
async function loadUser(req) {
  const token = readToken(req);
  if (!token) return { error: "Authentication required." };

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: "Invalid or expired token." };
  }

  const result = await pool.query(
    "SELECT id, role, is_active FROM users WHERE id = $1",
    [payload.id]
  );
  const user = result.rows[0];
  if (!user || !user.is_active) return { error: "Account not available." };
  return { user: { id: user.id, role: user.role } };
}

exports.authenticate = async (req, res, next) => {
  try {
    const { user, error } = await loadUser(req);
    if (error) return res.status(401).json({ message: error });
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Authentication failed." });
  }
};

// For public pages that can show extra info when logged in (e.g. "you joined")
exports.optionalAuth = async (req, res, next) => {
  req.user = null;
  try {
    const { user } = await loadUser(req);
    if (user) req.user = user;
  } catch (err) {
    console.error(err);
  }
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
};
