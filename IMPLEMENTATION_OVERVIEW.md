# Implementation Overview

This document captures the design and implementation decisions I made while building the Maintenance Request feature on top of the provided boilerplate.

For setup, scripts, env vars, and the base stack, see the [README](./README.md). This doc only covers what I added and why.

## What I built

- **Backend**: `MaintenanceRequest` Typegoose model, Zod-validated CRUD API, role-aware service layer, status-transition rules, and a small `GET /users` endpoint to support the assignee dropdown.
- **Frontend**: `/maintenance` page with list + filters + pagination, create form (tenants), edit form (managers/admins), delete confirmation dialog, and toast feedback upon submissions.
- **Tests**: unit tests for the service and the status-transition util, integration tests against `mongodb-memory-server` for both maintenance and users routes, plus a couple of frontend unit tests for validators and formatting helpers.
- **Seed data**: a handful of realistic requests across all four statuses, plus a second manager account, so the UI has something to render and filter against immediately after `make seed`.

## Domain model

The `MaintenanceRequest` model lives at `apps/backend/src/models/MaintenanceRequest.ts`.

Fields:

- `title`, `description` — trimmed, length-bounded.
- `status` — `open | in-progress | completed | cancelled`.
- `priority` — `low | normal | high | urgent`.
- `propertyId` — free-text string, under the assumption that a real `Property` model would exist.
- `createdBy` — `Ref<User>`, set from the authenticated tenant at create time.
- `assignedTo` — optional `Ref<User>`, only by a manager (enforced in the service).
- `completedAt` — auto stamped when status transitions to `completed`.
- `createdAt` / `updatedAt` — via `timestamps: true`.

Indexes:

- `{ createdBy: 1 }` — supports the tenant scoping query in `list` (business rule: tenants can only view their own requests).
- `{ status: 1, priority: 1 }` — supports the manager dashboard filters.

## Status transitions

`apps/backend/src/utils/maintenanceStatus.ts` as a helper:

```
open         → in-progress, cancelled
in-progress  → completed, cancelled
completed    → (terminal)
cancelled    → (terminal)
```

Same-status updates are allowed, so PATCHing other fields without changing status doesn't trip the transition check. `assertTransition` throws a 400 with a readable message. This lives in its own file so it can be unit-tested in isolation.

## Authorization

The boilerplate already has `admin`, `manager`, `tenant` roles. I followed the assignment's stated rule that requests can only be **assigned to managers** (not admins, not tenants). For everything else I picked the most natural mapping:

| Action            | Who                          |
| ----------------- | ---------------------------- |
| Create request    | tenant only                  |
| List requests     | all authenticated users      |
| Get one           | all authenticated users (\*) |
| Update / delete   | manager or admin             |
| Assignee dropdown | manager-role users only      |

(\*) Tenants only see their own requests in both `list` and `getById`. Scoping is done in the service layer (`createdBy === actor.id`) so it stays close to the data access.

Two enforcement layers:

1. **Route middleware** (`authorize('tenant')`, `authorize('manager', 'admin')`)
2. **Service-layer guards** — so the service can be called from tests without the Express middleware.

The service receives a small `AuthenticatedUser` (`{ id, email, role }`) shape that mirrors `req.user`, rather than passing the full `Request` around.

## API surface

Maintenance routes (all under `/api/maintenance`):

- `POST   /` — create (tenant)
- `GET    /` — list with `status`, `priority`, `assignedTo`, `page`, `limit` query params
- `GET    /:id` — fetch one
- `PATCH  /:id` — partial update (manager / admin)
- `DELETE /:id` — delete (manager / admin)

Users route (`/api/users`):

- `GET /?role=manager` — used by the frontend to populate the assignee dropdown. The `role` query param is Zod-validated; the response is id + name + email only.

## Frontend structure

The page is `apps/frontend/src/pages/MaintenancePage.tsx`. It owns the data-fetching state machine (filters, list, modal state, submitting/deleting flags) and delegates rendering to small components in `apps/frontend/src/components/maintenance/`:

- `MaintenancePageHeader`, `MaintenanceFilters`, `MaintenanceTable` + `MaintenanceTableRow`, `MaintenancePagination`, `MaintenanceEmptyState`
- `CreateMaintenanceForm`, `EditMaintenanceForm`, `FormActions`, `AssigneePicker`

I kept the rule of one component per file. Non-component code (Zod schemas, format helpers) lives outside of `components/` — schemas in `validators/`, helpers in `utils/`. Generic UI primitives (`Modal`, `ConfirmDialog`) sit at the top of `components/` because they aren't maintenance-specific.

Role-based UI is driven from `useAuth()`:

- `canCreate = user.role === 'tenant'` — controls the "New request" button
- `canManage = user.role === 'manager' || 'admin'` — controls the Actions column rendering (edit/delete buttons), and the assignee filter.

## Testing

I wrote a mix of integration and unit tests, leaning on integration where the value is high (route → middleware → service → real Mongoose):

- `services/maintenanceService.spec.ts` — unit tests against an in-memory Mongo: role restrictions, status-transition enforcement, `completedAt` stamping, manager-only assignment, tenant scoping in `list` and `getById`.
- `routes/maintenance.integration.spec.ts` — full HTTP requests via `supertest`, asserting status codes **and response payload shapes**, not just `toHaveBeenCalled()`.
- `routes/users.integration.spec.ts` — `role` query param plus Zod rejection of unknown values.
- `services/userService.spec.ts` — small unit test for UserService.
- `utils/maintenanceStatus.spec.ts` — status transition helper unit test
- `frontend/validators/maintenanceSchemas.spec.ts`, `frontend/utils/format.spec.ts` — coverage of the shared validator fields and the label formatter.

Tests run against `mongodb-memory-server` so they don't need a live MongoDB. Vitest config is at the root so all projects share one runner.
