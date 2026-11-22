
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
  })
);

app.use(express.json());

// Health checks
app.get("/", (req, res) => {
  res.json({ message: "Welcome to PADDLE POINT API!" });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database() AS database");
    res.json({
      message: "PostgreSQL connected successfully!",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed." });
  }
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courts", require("./routes/courtRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/open-plays", require("./routes/openPlayRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

// Bad JSON bodies and anything else unexpected
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON." });
  }
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith("replace_this")) {
  console.warn("WARNING: set a long random JWT_SECRET in backend/.env");
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PADDLE POINT API running on port ${PORT}`);
});
