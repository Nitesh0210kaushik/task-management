# Task Management Application

MEAN stack task management app with JWT authentication, role-based access, task CRUD, Angular UI, and Socket.IO realtime updates.

## Requirements

- Node.js 22 LTS
- MongoDB local or MongoDB Atlas

## Setup And Run Locally

### 1. Backend Setup

```bash
cd backend
npm install
```

Create the backend env file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

The default values work for local setup. Do not commit `backend/.env`.

For deployment, set the backend environment variables on the hosting platform using the keys from `backend/.env.example`.
Set `NODE_ENV=production`, use a MongoDB Atlas `mongodb+srv://` URI, and generate unique `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` values.

Seed demo data. Make sure MongoDB is running first.

```bash
npm run seed
```

Start the backend.

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend Setup

Open a new terminal from the project root.

```bash
cd frontend
npm install
ng serve
```

Frontend runs on `http://localhost:4200`.

## Demo Login

| Role | Email | Password |
| --- | --- | --- |
| Manager | manager@eminence.com | Password@123 |
| Team Lead | lead@eminence.com | Password@123 |
| Employee | employee@eminence.com | Password@123 |

## Useful Commands

### Root Monorepo Commands (Recommended)

You can run these commands directly from the root directory without changing folders:

- **Install all dependencies (Root, Backend, Frontend):**
  ```bash
  npm run install:all
  ```
- **Build both Frontend and Backend:**
  ```bash
  npm run build
  ```
- **Run Backend in Development Mode:**
  ```bash
  npm run dev:backend
  ```
- **Run Frontend in Development Mode:**
  ```bash
  npm run dev:frontend
  ```
- **Run Backend Tests:**
  ```bash
  npm run test:backend
  ```
- **Seed Database:**
  ```bash
  npm run seed
  ```

### Component-Specific Commands

Backend:

```bash
cd backend
npm install
npm run build
npm test
npm run seed
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Backend tests use `TEST_MONGODB_URI` when it is set. If it is not set, tests derive a `_test` database from `MONGODB_URI`.

## Deployment Notes

Backend service:

```bash
cd backend
npm install --include=dev
npm run build
npm start
```

Frontend/static service:

```bash
cd frontend
npm install
npm run build
```

Set backend environment variables on the hosting platform using the keys from `backend/.env.example`. Do not upload local `.env` files.

## Notes

- Public signup creates Employee accounts only.
- Manager can create Team Leads and view Employees; task assignment happens from the task form.
- Angular environment files contain only public API/socket URLs. Secrets stay only in backend `.env`.
- Local development uses localhost MongoDB; production must use a hosted MongoDB URI.
- Frontend production build uses the deployed site origin for `/api` and Socket.IO. For separate frontend/backend domains, update `frontend/src/environments/environment.prod.ts` before building.
