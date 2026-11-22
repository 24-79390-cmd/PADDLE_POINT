// One command that prepares PostgreSQL for PADDLE POINT:
//   1. creates the database (if it does not exist)
//   2. creates all tables + the three courts (sql/schema.sql)
//   3. creates the admin account (if ADMIN_* values are in .env)
//
// Run:  npm run setup-db
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const bcrypt = require("bcrypt");

const conn = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
};

async function main() {
  const dbName = process.env.DB_NAME || "paddle_point_db";
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error("DB_NAME may only contain letters, numbers and underscores.");
  }
  if (!conn.password || conn.password === "YOUR_POSTGRES_PASSWORD") {
    throw new Error("Set DB_PASSWORD in backend/.env to your real PostgreSQL password.");
  }

  // Step 1: create the database if needed
  const root = new Client({ ...conn, database: "postgres" });
  await root.connect();
  const exists = await root.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await root.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[1/3] Database "${dbName}" created.`);
  } else {
    console.log(`[1/3] Database "${dbName}" already exists.`);
  }
  await root.end();

  // Step 2: create tables
  const db = new Client({ ...conn, database: dbName });
  await db.connect();
  const sql = fs.readFileSync(path.join(__dirname, "..", "sql", "schema.sql"), "utf8");
  await db.query(sql);
  const courts = await db.query("SELECT COUNT(*)::int AS n FROM courts");
  console.log(`[2/3] Tables ready. Courts in database: ${courts.rows[0].n}`);

  // Step 3: admin account
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_NAME && ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD === "ChangeThisToAStrongPassword" || ADMIN_PASSWORD.length < 8) {
      throw new Error("Choose a real ADMIN_PASSWORD (at least 8 characters) in backend/.env.");
    }
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const found = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (found.rowCount > 0) {
      console.log("[3/3] Admin account already exists.");
    } else {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await db.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')",
        [ADMIN_NAME.trim(), email, hash]
      );
      console.log(`[3/3] Admin account created: ${email}`);
      console.log("      Now delete the ADMIN_* lines from backend/.env.");
    }
  } else {
    console.log("[3/3] No ADMIN_* values in .env, so no admin was created.");
  }
  await db.end();
  console.log("\nDatabase is ready. Start the API with: npm run dev");
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  if (err.code === "ECONNREFUSED") {
    console.error("PostgreSQL is not running (or DB_HOST / DB_PORT are wrong).");
  }
  if (err.code === "28P01") {
    console.error("Wrong PostgreSQL password. Check DB_USER and DB_PASSWORD in backend/.env.");
  }
  process.exit(1);
});
