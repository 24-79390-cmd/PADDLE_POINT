const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

function publicUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    mobile_number: u.mobile_number,
    role: u.role,
  };
}

// Customer registration. The role is always 'customer'; nothing from the client can change it.
exports.register = async (req, res) => {
  try {
    const { full_name, email, mobile_number, password, confirm_password } = req.body;

    if (!full_name || !email || !mobile_number || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, mobile_number, password_hash, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, full_name, email, mobile_number, role`,
      [full_name.trim(), normalizedEmail, mobile_number.trim(), hash]
    );

    const user = result.rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed." });
  }
};

// Login factory: one handler for customers and one for admins.
function makeLogin(requiredRole) {
  return async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND role = $2",
        [email.trim().toLowerCase(), requiredRole]
      );
      const user = result.rows[0];

      // Same message for "no such user" and "wrong password"
      const ok = user && (await bcrypt.compare(password, user.password_hash));
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      if (user.is_active === false) {
        return res.status(403).json({ message: "This account has been deactivated." });
      }

      res.json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Login failed." });
    }
  };
}

exports.customerLogin = makeLogin("customer");
exports.adminLogin = makeLogin("admin");

exports.me = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, mobile_number, role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: "User not found." });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load profile." });
  }
};
