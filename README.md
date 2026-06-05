# Task Management Application

MEAN stack task management app with JWT auth, role-based access, task CRUD, Angular UI, and Socket.IO realtime updates.

## Tech Stack

- MongoDB, Express, Node.js, TypeScript
- Angular standalone components
- JWT authentication with httpOnly cookies
- Socket.IO realtime task notifications

## Prerequisites

- Node.js 20+
- MongoDB running locally

## Setup

Install dependencies:

```bash
npm run install:all
```

Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` if needed. Do not commit real `.env` files.

Seed demo users:

```bash
npm run seed
```

## Run

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Open `http://localhost:4200`.

## Demo Users

| Role | Email | Password |
| --- | --- | --- |
| Manager | manager@example.com | Password@123 |
| Team Lead | lead@example.com | Password@123 |
| Employee | employee@example.com | Password@123 |

## Notes

- Public signup creates Employee accounts only.
- Manager accounts are seeded; Managers can create Team Leads and assign Employees to Team Leads.
- Angular does not use private `.env` files here. `frontend/src/environments/environment.ts` contains only public API/socket URLs and must not contain secrets.
- Build check: `npm run build`
