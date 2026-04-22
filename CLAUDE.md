# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kartalla is an interactive map survey platform (karttakyselypalvelu) for citizen engagement in municipal planning. The public can answer spatially-aware surveys via an embedded Oskari map. Municipal staff manage surveys through an admin interface.

## Development Environment

The full development environment runs via Docker:

```bash
docker-compose build && docker-compose up -d
```

Services: `client` (port 8080), `server` (port 3000), `database` (port 5432).

Before starting, create `/server/.env` by copying `/server/.template.env` and filling in the required values. The minimum required for local development is `DATABASE_ENCRYPTION_KEY`; leave `AUTH_ENABLED=false` to use a mock user.

Individual service logs: `docker-compose logs -f <service-name>`. Restart a service: `docker-compose restart <service-name>`.

## Commands

### Server (`/server`)
```bash
npm run dev          # Start with nodemon + vitest in watch mode
npm test             # Run all tests once
npm run lint         # ESLint
npm run build        # tsc (compile TypeScript)
npm run migrate      # Create a new migration file
```

### Client (`/client`)
```bash
npm run dev          # Vite dev server
npm run dev:local    # Vite dev server pointing to localhost:3000 API
npm test             # Run all tests once (vitest)
npm run lint         # ESLint
npm run build        # Vite build (no tests/lint, just bundle)
```

### E2E tests (`/e2e`)
The E2E environment has its own docker-compose. From `./e2e`:
```bash
npm test             # Headless Playwright run
npm run test-ui      # Playwright UI mode
npm run codegen      # Interactive test recorder
```

## Architecture

### Repository Structure

```
/
├── client/          # React frontend (two SPAs)
├── server/          # Express.js API server
├── interfaces/      # Shared TypeScript types (client ↔ server)
├── db/              # Database schema diagrams and documentation
└── e2e/             # Playwright end-to-end tests
```

### Shared Types (`/interfaces`)

The `interfaces/` directory contains `.d.ts` files shared between client and server via the `@interfaces/*` path alias. **Both workspaces import from here** — changes to these types affect both sides. Key files:
- `survey.d.ts` — core domain types: `Survey`, `SurveyPage`, `SurveyPageSection`, `AnswerEntry`, and all question subtypes
- `submission.d.ts` — submission model
- `user.d.ts` — user and organization types
- `userGroup.d.ts`, `mapPublications.d.ts`, `generalNotification.d.ts`

### Client (`/client/src`)

Two separate SPA entry points built by Vite:
- `index.tsx` → `Application.tsx` — the **public survey** at routes `/:organization/:name`
- `admin.tsx` → `AdminApplication.tsx` — the **admin panel** at `/admin/*`

State management uses React Context providers (in `stores/`), not a global store. Providers wrap both applications via the `Compose` component. MUI v5 is the component library. React Router v5 handles routing.

Path alias: `@src/*` maps to `./src/*`.

### Server (`/server/src`)

Express.js application with TypeScript. Entry point is `app.ts`:
- All API routes are prefixed `/api` and registered in `routes/index.ts`
- Static client files are served from `static/` in production
- The `/admin/*` path requires authentication; all other paths are public

Key modules:
- `database.ts` — pg-promise connection, helper functions for batch queries and GeoJSON column handling; searches default schemas `['application', 'public', 'data']`
- `auth/index.ts` — Passport.js setup; auth method selected via `AUTH_METHOD` env var (`azure` or `google-oauth`); when `AUTH_ENABLED=false`, a mock user is injected instead
- `application/` — business logic layer (survey CRUD, answer handling, CSV/Excel/PDF exports, screenshot generation)
- `routes/` — thin Express route handlers that delegate to `application/`
- `migrations/` — node-pg-migrate TypeScript migration files

Path aliases: `@src/*` → `src/*`, `@interfaces/*` → `../interfaces/*`.

### Database

PostgreSQL with PostGIS. Two schemas:
- `data` — survey content and answer data (surveys, pages, sections, submissions, answer entries)
- `application` — infrastructure (sessions via connect-pg-simple, migrations via node-pg-migrate tracked in `pgmigrations`)

Migrations run automatically on server startup (`migrateUp()`). To create a new migration: `npm run migrate` from `/server`.

### Authentication

Controlled by environment variables:
- `AUTH_ENABLED=false` → mock user injected (local dev default)
- `AUTH_ENABLED=true` + `AUTH_METHOD=azure` → Azure AD auth (v1 passport-azure-ad, optionally v2 via openid-client)
- `AUTH_ENABLED=true` + `AUTH_METHOD=google-oauth` → Google OAuth

User roles: `super_user` (full access), `organization_admin` (admin within org), `organization_user` (basic access). Access to surveys is scoped by organization and optionally by user groups.

### Gitflow

- Feature branches: `feature/<name>`
- Merge to `develop` (test environment)
- Merge `develop` → `main` (production)
- E2E tests run automatically on every pull request
