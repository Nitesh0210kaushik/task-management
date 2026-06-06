# Task Management Application

MEAN stack task management app with JWT authentication, role-based access, task CRUD, Angular UI, and Socket.IO realtime updates.

## Requirements

- Node.js 20+
- MongoDB local or MongoDB Atlas

## Setup And Run

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Create Backend Env File

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
```

The default values work for local setup. Do not commit `backend/.env`.

For deployment, set the backend environment variables on the hosting platform using `backend/.env.production.example` and use a MongoDB Atlas `MONGODB_URI`.
Set `NODE_ENV=production` in deployment. In production, the backend requires a MongoDB Atlas `mongodb+srv://` URI.

### 3. Seed Demo Data

Make sure MongoDB is running, then run:

```bash
npm run seed
```

### 4. Start Backend

Open one terminal:

```bash
npm run dev:backend
```

Backend runs on `http://localhost:5000`.

### 5. Start Frontend

Open another terminal:

```bash
npm run dev:frontend
```

Frontend runs on `http://localhost:4200`.

## Demo Login

| Role | Email | Password |
| --- | --- | --- |
| Manager | manager@eminence.com | Password@123 |
| Team Lead | lead@eminence.com | Password@123 |
| Employee | employee@eminence.com | Password@123 |

## Useful Commands

```bash
npm run build
npm run test:backend
npm run seed
```

Backend tests use `TEST_MONGODB_URI` when it is set. If it is not set, tests derive a `_test` database from `MONGODB_URI`.

## Notes

- Public signup creates Employee accounts only.
- Manager can create Team Leads and view Employees; task assignment happens from the task form.
- Angular environment files contain only public API/socket URLs. Secrets stay only in backend `.env`.
- Local development uses localhost MongoDB; production must use a hosted MongoDB URI.
- Frontend production build uses the deployed site origin for `/api` and Socket.IO. For separate frontend/backend domains, update `frontend/src/environments/environment.prod.ts` before building.
