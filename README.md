# Police Duty Roster Management System

Full-stack duty roster system for police officer deployment.

## Stack

- Frontend: React, TypeScript, ShadCN-style local UI components, TanStack Table, Recharts
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Excel: Pandas, OpenPyXL
- Export: Excel and PDF

## Features

- Officer CRUD, deactivation, availability statuses, skills, Excel upload, and Excel template download
- Duty CRUD with required rank, required skills, shift, priority, required officer count, and lifecycle status
- `POST /api/rosters/generate` fair/randomized roster allocation
- Allocation skips unavailable officers, prevents same-shift duplicates, prevents overlapping assignments, respects rank and skill requirements, and prioritizes officers with lower weekly hours
- Daily roster, roster history, manual reassignment/removal endpoints, and roster locking
- Analytics for duty coverage, fairness, utilization, shift/station/rank deployment, overtime, and under-utilization
- Excel and PDF roster exports
- Basic users/roles: Admin, DSP, CI, SI, Viewer
- Audit logs for duty creation, roster generation, reassignment, removal, and roster locking

## Local Setup

### PostgreSQL + Backend

Create/update the env files first:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

For local backend commands, `backend/.env` should point to localhost:

```env
DATABASE_URL=postgresql://drms:drms@localhost:5432/drms
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

```bash
docker compose up -d postgres
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

Backend URL: `http://localhost:8000`

Backend config lives in `backend/.env`. Copy `backend/.env.example` when creating a new environment.

Seeded users:

- `admin@drms.local` / `Admin123!`
- `viewer@drms.local` / `Viewer123!`

### Frontend

Create/update the frontend env file:

```bash
cp frontend/.env.example frontend/.env
```

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

Frontend config lives in `frontend/.env`. Set `VITE_API_BASE` there if the backend is not on `http://localhost:8000`.

## Key API Routes

- `GET /api/analytics/dashboard`
- `GET /api/officers`
- `POST /api/officers`
- `POST /api/officers/upload`
- `GET /api/officers/template`
- `GET /api/duties`
- `POST /api/duties`
- `POST /api/rosters/generate`
- `GET /api/rosters/daily?date=YYYY-MM-DD`
- `GET /api/rosters/history`
- `POST /api/rosters/reassign`
- `POST /api/rosters/{batch_id}/lock`
- `GET /api/reports/roster.xlsx`
- `GET /api/reports/roster.pdf`
- `GET /api/audit-logs`

## Verification

Completed locally:

```bash
PYTHONPYCACHEPREFIX=/tmp/drms_pycache python3 -m compileall backend/app
cd frontend && npm run build
```

The backend app was also import-checked against a temporary SQLite database to verify route/model wiring without requiring a running PostgreSQL container.
