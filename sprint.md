# Task Management Application - Sprint Tracker

This document is the working execution tracker for the MEAN stack task management application. It should be updated after every meaningful backend, frontend, testing, documentation, or GitHub milestone.

## Project Goal

Build a professional task management application using MongoDB, Express, Angular, and Node.js with JWT authentication, role-based authorization, task CRUD, responsive UI, validations, error handling, and optional real-time task updates.

## Role Rules

| Role | Access Rules |
| --- | --- |
| Manager | Can see all users, team leads, and tasks. Can create, modify, view, delete, and reassign tasks to anyone or self. |
| Team Lead | Can see, create, modify, delete, and assign tasks for self and assigned team members only. |
| Employee | Can create, view, update, and delete own tasks only. New tasks are automatically assigned to self. |

## Delivery Sprints

### Sprint 0 - Project Setup and Architecture

**Status:** Completed

**Goal:** Create a clean monorepo foundation and prepare the project for GitHub.

**Scope:**
- Create root project structure.
- Set up backend Express app.
- Set up Angular frontend app.
- Add environment examples.
- Add shared documentation files.
- Initialize Git after initial setup is ready.

**Deliverables:**
- `backend/` Express API project.
- `frontend/` Angular project.
- Root `README.md`.
- Root `document.md` for internal reference notes.
- Root `.gitignore`.
- Initial Git commit readiness.

**Acceptance Checks:**
- Backend project installs successfully.
- Frontend project installs successfully.
- Local setup instructions are clear.
- No secrets are committed.

### Sprint 1 - Authentication and User Roles

**Status:** Completed

**Goal:** Implement secure user registration, login, JWT authentication, and role-based authorization.

**Backend Scope:**
- User model with `username`, `email`, `password`, `role`, and team relationship fields.
- Password hashing with bcrypt.
- Registration API.
- Login API with JWT generation.
- Auth middleware.
- Role authorization middleware.
- Current logged-in user API.

**Frontend Scope:**
- Register page with validation.
- Login page with validation.
- Auth service.
- Token storage.
- Route guards.
- Basic authenticated layout.

**Acceptance Checks:**
- User can register.
- User can log in and receive token.
- Invalid credentials show safe error messages.
- Protected routes reject unauthenticated users.
- Role data is available to the UI.

### Sprint 2 - User Management and Team Structure

**Status:** Completed

**Goal:** Implement manager/team lead/employee visibility and assignment rules.

**Backend Scope:**
- User listing API with role-based filtering.
- Manager can view all users.
- Team Lead can view only assigned team members.
- Employee cannot list other users.
- Manager can assign employees to team leads.

**Frontend Scope:**
- Manager user list.
- Team Lead team member list.
- User assignment controls for manager.
- Role-aware navigation.

**Acceptance Checks:**
- Manager sees all users and team leads.
- Team Lead sees only own team members.
- Employee does not see user management screens.
- Unauthorized user-management actions are blocked by API.

### Sprint 3 - Task API and Authorization Rules

**Status:** Completed

**Goal:** Build complete task CRUD with strict role-based access control.

**Backend Scope:**
- Task model with `title`, `description`, `status`, `createdBy`, `assignedTo`, timestamps.
- Create task API.
- Read task list API.
- Update task API.
- Delete task API.
- Reassign task API where role permits.
- Status filtering API.

**Authorization Rules:**
- Manager can manage all tasks.
- Team Lead can manage tasks assigned to self or team members.
- Employee can manage only own tasks.
- Employee-created tasks are assigned to self automatically.

**Acceptance Checks:**
- Task CRUD works for permitted users.
- Unauthorized task access returns proper HTTP errors.
- Task timestamps are maintained by MongoDB.
- Task filtering by status works.

### Sprint 4 - Angular Task Dashboard

**Status:** Completed

**Goal:** Create a responsive task management UI with forms, filters, and role-aware actions.

**Frontend Scope:**
- Dashboard page.
- Task list with status badges.
- Add task form.
- Edit task form.
- Delete task action.
- Mark complete action.
- Status filter.
- Assignment dropdown for Manager and Team Lead.
- Employee self-assignment behavior.
- Loading, empty, and error states.

**Acceptance Checks:**
- UI works on desktop and mobile.
- Forms show validation errors.
- Task list refreshes after create/update/delete.
- Role-restricted controls are hidden in UI and protected by API.

### Sprint 5 - Real-Time Updates

**Status:** Completed

**Goal:** Add real-time task updates so managers and team leads see changes immediately.

**Backend Scope:**
- Add Socket.IO server.
- Authenticate socket connections with JWT.
- Join role/user/team-based rooms.
- Emit task created, updated, deleted, and reassigned events.

**Frontend Scope:**
- Socket client service.
- Live task list updates.
- Clean socket connect/disconnect on auth state changes.

**Acceptance Checks:**
- Employee task updates reflect for Team Lead and Manager without manual refresh.
- Manager receives relevant global task updates.
- Team Lead receives only permitted team task updates.
- Employee receives own task updates.

### Sprint 6 - Validation, Error Handling, and Polish

**Status:** Completed

**Goal:** Improve reliability, security, and user experience.

**Backend Scope:**
- Central error handler.
- Request validation.
- Consistent API response shape.
- Secure headers and CORS configuration.
- Rate limiting for auth endpoints if time allows.

**Frontend Scope:**
- Better toast/error messages.
- Confirmation before delete.
- Clean loading states.
- Form reset behavior.
- Responsive layout polish.

**Acceptance Checks:**
- Bad requests return clear validation errors.
- UI does not break on API errors.
- Sensitive backend errors are not exposed.
- Main workflows feel complete and professional.

### Sprint 7 - Testing, README, and Final Handoff

**Status:** In Progress

**Goal:** Verify the application and prepare it for submission.

**Scope:**
- Backend smoke tests or API checks.
- Frontend production build.
- README setup instructions.
- Seed/demo-user notes.
- Final documentation cleanup.
- GitHub push after review.

**Acceptance Checks:**
- Backend starts locally.
- Frontend builds successfully.
- README explains setup clearly.
- `document.md` contains useful implementation notes.
- Repository is ready for GitHub submission.

## Current Execution Board

| Item | Sprint | Status | Notes |
| --- | --- | --- | --- |
| Create sprint tracker | Planning | Done | `sprint.md` created first as requested. |
| Scaffold backend | Sprint 0 | Done | Express + TypeScript API created in `backend/`. |
| Scaffold frontend | Sprint 0 | Done | Angular standalone app created in `frontend/`. |
| Create internal docs | Sprint 0 | Done | `document.md` tracks implementation decisions. |
| Authentication and roles | Sprint 1 | Done | JWT auth, bcrypt password hashing, and role values implemented. |
| User management | Sprint 2 | Done | Manager/team lead visibility and manager team assignment implemented. |
| Task API | Sprint 3 | Done | Role-aware task CRUD and status filtering implemented. |
| Angular dashboard | Sprint 4 | Done | Auth pages, dashboard, task forms, filters, assignment UI implemented. |
| Real-time updates | Sprint 5 | Done | Socket.IO task change events added. |
| Validation and error handling | Sprint 6 | Done | Zod schemas, centralized error handler, CORS, Helmet, auth rate limit added. |
| Build verification | Sprint 7 | Done | Backend and frontend production builds pass. |
| Initialize Git | Sprint 7 | In Progress | Local repo initialized; GitHub remote will be set to `Nitesh0210kaushik/task-management`. |

## Work Log

### 2026-06-05

- Created the sprint tracker before implementation.
- Created separate `backend/` and `frontend/` folders.
- Implemented Express + TypeScript backend with MongoDB models, JWT auth, role checks, task CRUD, user management, and Socket.IO.
- Implemented Angular frontend with register/login, protected dashboard, users panel, task form, status filters, and role-aware assignment controls.
- Upgraded frontend Angular dependencies to 21.x after npm audit reported advisories in Angular 18.x.
- Replaced deprecated `lucide-angular` with maintained `@lucide/angular`.
- Verified `npm run build --prefix backend`.
- Verified `npm run build --prefix frontend`.
- Preparing first GitHub push to `https://github.com/Nitesh0210kaushik/task-management.git`.

## Documentation Rules

- Update this file whenever a sprint starts, completes, or scope changes.
- Update `document.md` with implementation decisions, API notes, schemas, and frontend architecture notes.
- Keep README focused on setup and usage for evaluators.
- Do not commit `.env` files or secrets.
- Prefer small commits at meaningful checkpoints.
