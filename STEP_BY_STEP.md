# PADDLE POINT: Step-by-Step Guide

Follow these steps in order. Each step ends with a **Check** so you know it worked before moving on.

---

## Part A: Install the tools (once)

| Tool | Get it from | Notes |
|---|---|---|
| VS Code | code.visualstudio.com | Your editor |
| Node.js (LTS) | nodejs.org | Includes `npm`. Check: `node -v` |
| PostgreSQL | postgresql.org/download | Remember the **password** you set for the `postgres` user. Keep port 5432. pgAdmin is included. |
| Postman (optional) | postman.com | Only for testing the API by hand |

**Check:** open a terminal and run `node -v` and `npm -v`. Both should print a version.

---

## Part B: Open the project

1. Unzip `PADDLE_POINT.zip`.
2. In VS Code: **File → Open Folder** and choose the `PADDLE_POINT` folder.
3. You should see two folders: `backend` and `frontend`.
4. Open a terminal: **Terminal → New Terminal**.

---

## Part C: Backend and database

### Step 1: Install backend packages
```
cd backend
npm install
```

### Step 2: Create your settings file
Copy `.env.example` to `.env`:
- Windows: `copy .env.example .env`
- Mac/Linux: `cp .env.example .env`

Open `backend/.env` and change:

| Setting | What to put |
|---|---|
| `DB_PASSWORD` | The PostgreSQL password you chose during installation |
| `JWT_SECRET` | A long random string. Generate one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Your admin login. Use a real password (8+ characters). The example password is rejected on purpose. |

### Step 3: Create the database automatically
```
npm run setup-db
```
This one command:
1. creates the database `paddle_point_db`,
2. creates all 6 tables and the 3 courts,
3. creates your admin account.

**Check:** you should see `[1/3]`, `[2/3] ... Courts in database: 3`, `[3/3] Admin account created`.
It is safe to run again; it never duplicates anything.

### Step 4: Remove the admin password from `.env`
Delete the three `ADMIN_` lines from `backend/.env`. The account now lives in the database (as a hash), so the plain password no longer needs to sit in a file.

### Step 5: Start the backend
```
npm run dev
```
**Check:** the terminal says `PADDLE POINT API running on port 5000`. Then open these in your browser:
- http://localhost:5000/  shows `Welcome to PADDLE POINT API!`
- http://localhost:5000/api/test-db  shows `PostgreSQL connected successfully!`
- http://localhost:5000/api/courts  shows your 3 courts as JSON

Leave this terminal running.

---

## Part D: Frontend

Open a **second** terminal (click the `+` in the terminal panel):
```
cd frontend
npm install
npm run dev
```
**Check:** open http://localhost:5173. You should see the PADDLE POINT homepage with three court cards.

Keep both terminals running while you work (backend on 5000, frontend on 5173).

---

## Part E: Try every feature (testing checklist)

Do these in order. Tick each one.

**Customer**
- [ ] Register at `/register` with a test email. You land on **My Bookings**.
- [ ] Log out, then log in at `/login`.
- [ ] Go to **Book a Court**: choose Court 1, a date, a start time, a duration, then **Submit**.
- [ ] You see a booking code like `PP-20261116-A82F`, status **pending**, and the pay-at-venue notice.
- [ ] Try booking the **same court and time** again. That time is now greyed out. (Even if you force it through the API, the database refuses it.)
- [ ] Book **Court 2** at the same time. This works, because it is a different court.
- [ ] In **My Bookings**, cancel one booking. The time becomes free again.

**Admin** (open http://localhost:5173/admin/login, not linked in the menu on purpose)
- [ ] Log in with the admin email and password from Step 2.
- [ ] **Bookings** tab: search by the booking code, then click **Confirm**.
- [ ] **Courts** tab: change a price, tick or untick "Available", **Save**. Check the public Courts page.
- [ ] **Schedule** tab: block Court 3 for an hour. Check that hour is greyed out on the booking page.
- [ ] **Open Plays** tab: create a session (try a time that clashes with a booking: it is refused).
- [ ] **Customers** tab: deactivate your test customer. They can no longer log in.
- [ ] **Overview** and **Reports** tabs show your numbers.

**Open Play (customer)**
- [ ] Open **Open Plays**, click **Join Open Play**, then **Leave**.
- [ ] Set a session's max players to 2 in the admin tab, join with 2 accounts, and watch it become **Full**.

**Security checks**
- [ ] While logged in as a customer, visit `/admin`. You are sent away.
- [ ] Log in at `/admin/login` with a **customer** account. It is refused.

---

## Part F: Testing the API in Postman (optional)

Base URL: `http://localhost:5000/api`
For protected routes add the header `Authorization: Bearer <token>` (the token comes from a login response).

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create customer account |
| POST | `/auth/login` | public | Customer login |
| POST | `/auth/admin/login` | public | Admin login |
| GET | `/auth/me` | logged in | Current user |
| GET | `/courts` | public | The three courts |
| GET | `/courts/:id/availability?date=YYYY-MM-DD` | public | Hourly availability |
| POST | `/bookings` | customer | Body: `court_id, date, start_hour, duration` |
| GET | `/bookings/mine` | customer | Your bookings |
| PATCH | `/bookings/:id/cancel` | customer | Cancel your booking |
| GET | `/open-plays` | public | Upcoming sessions |
| GET | `/open-plays/mine` | customer | Sessions you joined |
| POST / DELETE | `/open-plays/:id/join` | customer | Join / leave |
| GET | `/admin/stats` | admin | Dashboard numbers |
| GET | `/admin/bookings?status=&q=` | admin | All bookings |
| PATCH | `/admin/bookings/:id/status` | admin | Body: `{"status":"confirmed"}` |
| PUT | `/admin/courts/:id` | admin | Edit a court |
| GET / POST | `/admin/blocked` | admin | Blocked times |
| DELETE | `/admin/blocked/:id` | admin | Remove a block |
| GET | `/admin/customers` | admin | Customer list |
| PATCH | `/admin/customers/:id/active` | admin | Body: `{"is_active":false}` |
| GET | `/admin/reports?period=daily` | admin | `daily`, `weekly` or `monthly` |
| GET / POST | `/admin/open-plays` | admin | List / create sessions |
| PUT | `/admin/open-plays/:id` | admin | Edit a session |
| PATCH | `/admin/open-plays/:id/cancel` | admin | Cancel a session |

Example booking body:
```json
{ "court_id": 1, "date": "2026-11-20", "start_hour": 18, "duration": 2 }
```

---

## Part G: Make it yours

| Change | Where |
|---|---|
| Court prices, descriptions, photos, availability | Admin → **Courts** tab (no code needed) |
| Phone, email, Facebook text | `frontend/src/config.js` |
| Opening hours (default 6 AM to 10 PM) | `backend/utils/constants.js` **and** `frontend/src/config.js` (keep them identical) |
| Longest booking (default 4 h), cancel limit (default 2 h before) | `backend/utils/constants.js` |
| Colors | the `:root` block at the top of `frontend/src/index.css` |
| Court photos | In Admin → Courts, paste an image URL. Use photos you own or have permission to use. |

---

## How it fits together

```
Browser (React, :5173)  --Axios + JWT-->  Express API (:5000)  --pg-->  PostgreSQL
```
- **Frontend** (`frontend/src`): pages, components, and `api/axios.js` (adds your login token to each request).
- **Backend** (`backend`): `routes/` (URLs) → `controllers/` (logic) → PostgreSQL. `middleware/` checks login and role. `utils/conflicts.js` prevents clashes.
- **Database** (`backend/sql/schema.sql`): 6 tables. A database rule also blocks overlapping bookings, so even a bug or a double-click cannot double-book a court.

Rules the system enforces:
- Only the three courts exist; there is no way to add more from the website.
- No online payment anywhere. Bookings are never marked as paid.
- Pending and confirmed bookings block the time; rejected and cancelled ones release it; completed ones stay in history.
- The admin role comes from the database on every request, never from the browser.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm run setup-db`: "password authentication failed" | `DB_PASSWORD` in `backend/.env` is not your PostgreSQL password. |
| `setup-db`: "connection refused" | PostgreSQL is not running. Start the PostgreSQL service (Windows: Services → postgresql). |
| `setup-db`: "could not open extension control file btree_gist" | Your PostgreSQL install is missing the contrib extras. Re-run the installer and include them. |
| Site loads but courts are empty / "Is the backend running?" | Start the backend (`npm run dev` in `backend`) and check http://localhost:5000/api/courts. |
| CORS error in the browser console | Open the site at exactly `http://localhost:5173`. |
| "Invalid email or password" for admin | Admin logs in at `/admin/login`, not `/login`. |
| Forgot the admin password | Delete the admin row in pgAdmin (`users` table), put new `ADMIN_*` values in `.env`, run `npm run setup-db` again. |
| `npm install` fails on `bcrypt` | Use Node.js LTS, then delete `node_modules` and run `npm install` again. |
| Port 5000 already in use | Change `PORT` in `backend/.env` and `VITE_API_URL` (create `frontend/.env` with `VITE_API_URL=http://localhost:5001/api`). |

---

## Before putting it online (checklist)

- Use a long random `JWT_SECRET` and a strong admin password, and never commit `.env`.
- Change `CLIENT_URL` in the backend `.env` to your real website address.
- Host PostgreSQL somewhere with backups, and serve the site over HTTPS.
- Replace the placeholder phone and email in `frontend/src/config.js` and the placeholder ₱200 price.
