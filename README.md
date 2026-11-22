# PADDLE POINT

Pickleball court booking and management system for Balayan, Batangas.
React + Vite (frontend), Node + Express (backend), PostgreSQL (database).

```
PADDLE_POINT/
├── backend/        Express API   (http://localhost:5000)
│   ├── sql/schema.sql        all tables + the 3 courts
│   ├── scripts/setupDb.js    creates the database, tables and admin
│   ├── controllers/ routes/ middleware/ utils/
│   └── .env.example
├── frontend/       React app     (http://localhost:5173)
└── STEP_BY_STEP.md  <-- start here
```

## Quick start

```
cd backend
npm install
copy .env.example .env        (Mac/Linux: cp .env.example .env)
# edit .env: DB_PASSWORD, JWT_SECRET, ADMIN_* values
npm run setup-db              # creates database + tables + admin
npm run dev                   # API on :5000

# second terminal
cd frontend
npm install
npm run dev                   # site on :5173
```

Customer: http://localhost:5173/register
Admin: http://localhost:5173/admin/login

Full instructions, testing checklist, API list and troubleshooting: **STEP_BY_STEP.md**
