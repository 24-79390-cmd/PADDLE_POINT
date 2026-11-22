-- PADDLE POINT DATABASE (PostgreSQL)
-- Safe to run more than once: it only creates what is missing.
-- Run automatically by:  npm run setup-db

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. USERS (customers and administrators)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Added so admins can deactivate customer accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. COURTS (exactly three)
CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    court_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    court_type VARCHAR(30) DEFAULT 'Outdoor',
    price_per_hour NUMERIC(10,2) NOT NULL
        CHECK (price_per_hour >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    court_id INTEGER NOT NULL REFERENCES courts(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL
        CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
    payment_method VARCHAR(30) DEFAULT 'pay_at_venue'
        CHECK (payment_method = 'pay_at_venue'),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_at > start_at),

    -- The database itself refuses overlapping pending/confirmed bookings
    CONSTRAINT no_overlapping_bookings
    EXCLUDE USING GIST (
        court_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    )
    WHERE (status IN ('pending', 'confirmed'))
);

-- 4. COURT BLOCKED SCHEDULES (maintenance, private events)
CREATE TABLE IF NOT EXISTS court_blocked_schedules (
    id SERIAL PRIMARY KEY,
    court_id INTEGER NOT NULL REFERENCES courts(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_at > start_at)
);

-- 5. OPEN PLAYS (group sessions)
CREATE TABLE IF NOT EXISTS open_plays (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    court_id INTEGER NOT NULL REFERENCES courts(id),
    host_id INTEGER NOT NULL REFERENCES users(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    skill_level VARCHAR(30) DEFAULT 'All Levels',
    max_players INTEGER NOT NULL CHECK (max_players > 0),
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'full', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_at > start_at)
);

-- 6. OPEN PLAY PARTICIPANTS
CREATE TABLE IF NOT EXISTS open_play_participants (
    id SERIAL PRIMARY KEY,
    open_play_id INTEGER NOT NULL REFERENCES open_plays(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (open_play_id, user_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_blocked_court ON court_blocked_schedules(court_id);
CREATE INDEX IF NOT EXISTS idx_open_plays_date ON open_plays(start_at);

-- THE THREE COURTS (inserted only when the table is empty).
-- The price is a placeholder: change it in the Admin > Courts tab.
INSERT INTO courts (court_name, description, court_type, price_per_hour)
SELECT v.court_name, v.description, 'Outdoor', 200.00
FROM (VALUES
    ('Court 1', 'PADDLE POINT pickleball court 1 in Balayan, Batangas.'),
    ('Court 2', 'PADDLE POINT pickleball court 2 in Balayan, Batangas.'),
    ('Court 3', 'PADDLE POINT pickleball court 3 in Balayan, Batangas.')
) AS v(court_name, description)
WHERE NOT EXISTS (SELECT 1 FROM courts);
