# Task Management Application

Professional MEAN stack task management app with JWT authentication, role-based authorization, task CRUD, Angular UI, and Socket.IO real-time updates.

## Tech Stack

- MongoDB + Mongoose
- Express + Node.js + TypeScript
- Angular standalone components
- JWT authentication
- Socket.IO real-time task updates

## Local Setup

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Backend Environment

Copy `backend/.env.example` to `backend/.env` and update values if needed.

```bash
cp backend/.env.example backend/.env
```

Default backend values:

```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/task_management_mean
JWT_SECRET=change-this-secret-before-production
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:4200
```

### 3. Seed Demo Users

Start MongoDB locally, then run:

```bash
npm run seed
```

Demo credentials:

| Role | Email | Password |
| --- | --- | --- |
| Manager | manager@example.com | Password@123 |
| Team Lead | lead@example.com | Password@123 |
| Employee | employee@example.com | Password@123 |

### 4. Run Locally

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Open `http://localhost:4200`.

## Role Rules

- Manager can see all users and all tasks, and can assign/reassign tasks to anyone.
- Team Lead can see and manage tasks for self and assigned team members.
- Employee can create and manage only own tasks. Employee-created tasks are assigned to self.

## Useful Scripts

```bash
npm run build
npm run seed
npm run dev:backend
npm run dev:frontend
```

## Notes

- Do not commit real `.env` files.
- `sprint.md` tracks sprint progress.
- `document.md` contains implementation decisions and internal reference notes.

