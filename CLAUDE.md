# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Streudel is a full-stack recipe and shopping list app monorepo:

- **`mobile/`** — React Native (Expo SDK 54) mobile app. Primary focus of development. See `mobile/CLAUDE.md` for detailed mobile guidance.
- **`server/`** — Express.js + TypeScript REST API, deployed on Railway
- **`client/`** — React web client (Vite + TailwindCSS) — largely inactive, mobile is the product
- **`shared/`** — Drizzle ORM schema shared between server and client (`shared/schema.ts`)
- **`scripts/`** — SQL utilities for database maintenance
- **`.claude/plans/`** — All planning documents, implementation plans, and backend specs live here

## Server Commands

```bash
cd server

# Development (with hot reload)
npm run dev

# Type check
npm run check

# Push schema changes to database
npm run db:push

# Production build
npm run build
```

**Environment variables required:** `DATABASE_URL` (PostgreSQL), `PORT` (defaults 5000), `NODE_ENV`

## Server Architecture

**Stack:** Express.js 4, TypeScript, PostgreSQL via Drizzle ORM, Passport.js (Google OAuth), `connect.sid` session cookies

Key files:
- `server/routes.ts` — All API route definitions (~81KB, single file)
- `server/storage.ts` — Database access layer (~48KB, all DB queries)
- `server/db.ts` — PostgreSQL pool + Drizzle initialization
- `server/aiCategorizer.ts` — Claude API integration (task categorization, suggestions)
- `server/googleAuth.ts` — Google OAuth setup

**Session auth:** Passport sets `connect.sid` cookie → stored in mobile's secure storage → attached to all API requests via Axios interceptor → auto-logout on 401.

**Database:** Schema defined in `shared/schema.ts` (Drizzle). The server imports types from there. To add a new table or column: update `shared/schema.ts`, then run `npm run db:push` from `server/`.

## Mobile Overview

> Full architecture details are in `mobile/CLAUDE.md`. Summary only here.

- **Expo Router** (file-based): `app/(tabs)/` for main tabs, modal routes at app root level
- **API:** Singleton Axios client in `src/services/api/client.ts`, all endpoints in `src/constants/api.ts`
- **Auth:** Google OAuth → session cookie → `expo-secure-store`
- **State:** React Context (primary), Zustand (minimal), local `useEffect` fetches in most screens
- **Theming:** `src/constants/colors.ts` → `Colors[effectiveTheme]`
- **Dev bypass:** Set `USE_DEV_COOKIE = true` in `src/constants/devConfig.ts` to skip OAuth

```bash
cd mobile
npm start          # Start Expo dev server
npm run ios        # iOS simulator
npm start -- --clear  # Clear Metro cache
npx tsc --noEmit   # Type check
npx eslint .       # Lint
```

**Always use `--legacy-peer-deps`** when installing mobile packages to avoid `react-native-worklets` version mismatch with Expo Go.

## Domain Terminology

- **Project** — what the UI calls a high-level objective (internal API field name is still `goal`/`goalId` — rename is UI-only)
- **Task** — a discrete actionable item, optionally assigned to a project
- **Habit** — a recurring behavior with a frequency target
- **Countdown** — a date-based timer to a future event

## Planning Documents

All plans go in `.claude/plans/` at the **monorepo root** — this applies to any plan generated anywhere within the life-ordered directory tree (mobile/, server/, client/, etc.). Never use auto-generated or random plan filenames.

- Name descriptively by feature: `task-form-redesign-project-rename.md`, `execution-sessions.md`
- Include area prefix only if ambiguous: `mobile-navigation.md`, `server-auth-refactor.md`
- Always rename/move plans to this directory before completing a planning session

## Known Pending Backend Work

| Feature | Missing |
|---------|---------|
| Onboarding (Phase 1.1) | `hasCompletedOnboarding` field on `/api/settings` — currently falls back to `expo-secure-store` |
| Execution Sessions (Phase 1.2) | `POST/GET /api/execution-sessions` endpoints |
| Habit identity (Phase 2) | `identityGoal` field on `/api/habits` |

The mobile app gracefully handles missing endpoints (detects HTML responses, returns empty data).