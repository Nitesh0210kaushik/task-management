# Internal Reference Document

This file is for implementation tracking and developer reference. Keep evaluator-facing setup instructions in `README.md`; keep sprint progress in `sprint.md`.

## Architecture Decisions

### Monorepo Layout

- `backend/` contains the Express, MongoDB, JWT, and Socket.IO API.
- `frontend/` contains the Angular standalone UI.
- Root scripts delegate to backend and frontend package scripts.

### Backend Approach

- TypeScript is used for stronger contracts and easier maintenance.
- Mongoose schemas model users and tasks.
- JWT auth protects all task and user-management APIs.
- Role checks are enforced on the API, not only in the UI.
- Socket.IO emits task changes to only the users/roles that can see those changes.
- Zod validates request bodies and query params.
- Helmet, CORS, JSON body limits, morgan logging, and auth rate limiting are configured.

### Frontend Approach

- Angular standalone components keep the app lightweight and modern.
- Auth state is centralized in `AuthService`.
- Route guards protect authenticated pages.
- Dashboard UI changes based on user role, but backend remains the source of truth.
- Angular 21 is used after dependency audit updates.
- `@lucide/angular` standalone icon components are used for dashboard action buttons.

## Role Model

| Role | Internal Value |
| --- | --- |
| Manager | `manager` |
| Team Lead | `teamLead` |
| Employee | `employee` |

Employees can be linked to one Team Lead using `teamLeadId`.

## API Notes

Base URL: `http://localhost:5000/api`

Main route groups:

- `/auth`
- `/users`
- `/tasks`

### Auth Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register user with username, email, password, and role. |
| POST | `/auth/login` | Public | Login and receive JWT token. |
| GET | `/auth/me` | Authenticated | Get current logged-in user. |

### User Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/users` | Manager, Team Lead | Manager sees all users; Team Lead sees self and team members. |
| PATCH | `/users/:id/team-lead` | Manager | Assign or unassign an employee to a team lead. |

### Task Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/tasks` | Authenticated | List visible tasks. Supports `status=pending` or `status=completed`. |
| POST | `/tasks` | Authenticated | Create task. Employee tasks auto-assign to self. |
| PATCH | `/tasks/:id` | Authenticated + permitted role | Update title, description, status, or assignment where allowed. |
| DELETE | `/tasks/:id` | Authenticated + permitted role | Delete a permitted task. |

## Realtime Notes

- Socket.IO authenticates connections using the same JWT.
- Each socket joins a `user:{id}` room.
- Managers also join `role:manager`.
- Task create/update/delete events are emitted to managers, creator, assignee, and relevant team lead users.

## Verification Notes

| Check | Status | Notes |
| --- | --- | --- |
| Backend build | Passed | `npm run build --prefix backend` |
| Frontend build | Passed | `npm run build --prefix frontend` |
| Frontend audit | Partial | Remaining `webpack-dev-server`/`sockjs`/`uuid` moderate advisory has no current npm fix available through audit. |

## Repository

- GitHub remote: `https://github.com/Nitesh0210kaushik/task-management.git`
- Target branch: `main`

## Sprint Log

### 2026-06-05

- Created `sprint.md` before implementation.
- Started Sprint 0 implementation.
- Added complete backend and frontend implementation.
- Verified backend and frontend builds.
- Preparing initial GitHub checkpoint push.
