# Life | Ordered Mobile App

A React Native mobile app built with Expo for the Life | Ordered todo/habit/goal tracking API.

## Features

- Google OAuth authentication (Facebook and Apple coming soon)
- Goals management with tasks
- Habit tracking with completion history
- Task management
- Countdown timers
- Today view for daily focus

## Tech Stack

- **Framework:** Expo (React Native) with TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **API Client:** Axios with cookie/session interceptors
- **Authentication:** expo-auth-session + expo-web-browser
- **Storage:** expo-secure-store for session cookies

## Project Structure

```
life-ordered-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Login screens
│   │   ├── login.tsx
│   │   └── oauth-callback.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── today.tsx
│   │   ├── goals.tsx
│   │   ├── tasks.tsx
│   │   ├── habits.tsx
│   │   └── countdowns.tsx
│   ├── _layout.tsx              # Root layout with auth routing
│   └── index.tsx                # Entry point
├── src/
│   ├── components/              # Reusable UI components
│   ├── services/
│   │   ├── api/                 # API client + resource services
│   │   └── storage/             # Secure storage
│   ├── store/                   # Zustand stores
│   ├── hooks/                   # Custom hooks
│   ├── types/                   # TypeScript definitions
│   ├── utils/                   # Helper functions
│   └── constants/               # API endpoints, colors, config
└── assets/                      # Images, icons
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator
- Expo Go app on your physical device (for quick testing)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create required assets in the `assets/` folder:
   - `icon.png` - App icon (1024x1024)
   - `splash.png` - Splash screen
   - `adaptive-icon.png` - Android adaptive icon
   - `favicon.png` - Web favicon

   You can use placeholder images for now.

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Authentication Setup

### Current Status

The app currently supports **Google OAuth only**. The backend API handles the OAuth flow.

### How OAuth Works

1. User taps "Sign in with Google" on the login screen
2. Opens browser to `https://lifeordered.com/api/auth/google`
3. Backend handles OAuth and sets session cookie
4. Redirects back to app with `lifeordered://oauth-callback`
5. App extracts cookie and stores it securely
6. Cookie is included in all subsequent API requests

### Backend Requirements

For Google OAuth to work, your backend must:
1. Have `/api/auth/google` endpoint that handles OAuth flow
2. Support redirect URL parameter: `/api/auth/google?redirect=<app-redirect-uri>`
3. Set session cookie after successful authentication
4. Redirect to the provided redirect URL after auth

### Adding Facebook/Apple OAuth (Future)

To add Facebook and Apple authentication:

1. **Backend updates:**
   - Implement `/api/auth/facebook` endpoint
   - Implement `/api/auth/apple` endpoint
   - Configure OAuth apps in Facebook/Apple Developer consoles

2. **Mobile app updates:**
   - Uncomment Facebook/Apple buttons in `app/(auth)/login.tsx`
   - Update `src/services/api/auth.ts` OAuth cases

3. **Apple Sign In (Required for App Store):**
   - Enable "Sign in with Apple" capability in Xcode
   - Add Apple Developer account to app
   - Use `expo-apple-authentication` for native button

## API Integration

### Base URL

```typescript
const API_BASE_URL = 'https://lifeordered.com';
```

### Available Endpoints

See `src/constants/api.ts` for all endpoints.

### Cookie/Session Management

The app uses session-based authentication with cookies:
- Session cookie is stored securely using `expo-secure-store`
- Axios interceptor automatically adds cookie to all requests
- 401 responses trigger automatic logout

## Development

### Running the App

```bash
# Start development server
npm start

# Start with cache clear
npm start -- --clear

# Run on specific platform
npm run ios
npm run android
npm run web
```

### Code Quality

```bash
# Run TypeScript checks
npx tsc --noEmit

# Run ESLint
npx eslint .

# Format with Prettier
npx prettier --write .
```

## Deep Linking

The app uses the custom URL scheme `lifeordered://` for OAuth callbacks and deep linking.

**Example deep link:**
```
lifeordered://oauth-callback
```

## Building for Production

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Configure EAS Build

```bash
eas build:configure
```

### Build for iOS

```bash
eas build --platform ios
```

### Build for Android

```bash
eas build --platform android
```

### Submit to App Stores

```bash
eas submit --platform ios
eas submit --platform android
```

## Current Status

### ✅ Completed (Phase 1)

- Project setup with Expo and TypeScript
- Expo Router with tab navigation
- Authentication system with Google OAuth
- API client with cookie/session handling
- Zustand state management for auth
- Login screen and auth routing
- Basic tab structure

### 🚧 In Progress (Phase 2)

- API integration for all resources
- State management for goals, tasks, habits, countdowns
- UI components library

### 📋 TODO (Phase 3-6)

- Complete all screen implementations
- Drag & drop reordering
- Habit completion calendar
- Markdown notes editor
- Production builds
- App store submission

## Troubleshooting

### OAuth Not Working

1. Check that backend OAuth endpoint is accessible
2. Verify redirect URL is configured correctly in backend
3. Check that `expo-auth-session` has correct scheme in `app.json`
4. Try clearing app data and SecureStore

### Cookie Not Persisting

1. Verify backend sends `Set-Cookie` header
2. Check `axios` interceptor is capturing cookies
3. Confirm `expo-secure-store` is working (check permissions)

### Build Errors

1. Clear cache: `npm start -- --clear`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

## API Documentation

API documentation is available at: https://lifeordered.com/api-docs/

## License

Private project

## Support

For issues or questions, contact the development team.
