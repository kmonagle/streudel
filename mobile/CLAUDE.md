# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Streudel is a React Native mobile app built with Expo SDK 54 and TypeScript. It's a recipe and shopping list app. The app communicates with a REST API deployed on Railway.

## Commands

```bash
# Start dev server
npm start

# Start with cache clear
npm start -- --clear

# Run on platform
npm run ios
npm run android

# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Format
npx prettier --write .

# Build for production (requires EAS CLI)
eas build --platform ios
eas build --platform android
```

There are no test commands configured — no test framework is set up.

## Architecture

### Routing (Expo Router — file-based)

- `app/_layout.tsx` — Root layout wrapping the app in context providers (Auth → Settings → Subscription → Calendar → Share)
- `app/(tabs)/` — Main tab navigation: Today, Habits, My Stuff, Recipes, Settings (goals/tasks/countdowns tabs exist but are hidden via `href: null`)
- `app/login.tsx` — Login screen (standalone, not in auth group)
- `app/index.tsx` — Entry point, redirects based on auth state and start screen preference
- Modal/full-screen routes: `habit-calendar`, `recipe-manager`, `execution`, `capture`, `subscription`, `shopping-list`

### API Layer

- `src/services/api/client.ts` — Singleton Axios client with cookie-based session auth. Interceptors handle attaching `connect.sid` cookie to requests and auto-logout on 401.
- `src/services/api/*.ts` — Resource-specific API modules (goals, tasks, habits, countdowns, captures, recipes, shoppingLists, etc.)
- `src/constants/api.ts` — All API endpoint paths defined as `API_ENDPOINTS`
- `src/constants/devConfig.ts` — Set `USE_DEV_COOKIE = true` with a session cookie to bypass OAuth during development

### Auth Flow

Google OAuth via browser redirect → backend sets `connect.sid` session cookie → cookie stored in `expo-secure-store` → attached to all API requests. The `AuthContext` handles session validation on app load and auto-logout on 401 responses.

### State Management

- React Context for cross-cutting concerns: `AuthContext`, `SettingsContext`, `SubscriptionContext`, `CalendarContext`, `ShareContext`
- Zustand stores exist (`src/store/`) but contexts are the primary state mechanism
- Most screens fetch data directly in `useEffect` and manage local state

### Theming

`src/constants/colors.ts` defines a `Colors` object with `light` and `dark` keys. Access via `useSettings().effectiveTheme` and `Colors[effectiveTheme]`.

### Data Model Conventions

Models in `src/types/models.ts` have legacy field names alongside new ones (e.g., `name` vs `title`, `isOnToday` vs `isToday`). When creating/updating, use the new field names (`title`, `isToday`). The `@/*` path alias maps to `./src/*`.

### Subscription/Premium

RevenueCat (`react-native-purchases`) handles in-app subscriptions. `SubscriptionContext` manages tier state. `PremiumGate` component gates premium features. Tier limits defined in `src/constants/tierLimits.ts`.

## Key Conventions

- ESLint enforces `@typescript-eslint/no-explicit-any` as error
- Icons use `@expo/vector-icons` (Ionicons)
- URL scheme: `streudel://` for deep links and OAuth callbacks
- The app supports drag-and-drop reordering via `react-native-draggable-flatlist`
