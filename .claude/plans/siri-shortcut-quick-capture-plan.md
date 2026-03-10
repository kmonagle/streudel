# Quick Capture Design

**Date:** 2026-03-05
**Status:** Ready for Implementation

## Overview

Enable universal task capture across Apple devices (iPhone, Mac, Watch, iPad) via Siri Shortcuts, followed by an iOS home screen widget for one-tap capture.

### Problem

Users lose thoughts before they can capture them. The current flow requires opening the app, navigating, and tapping—too much friction when a thought strikes.

### Solution

1. **Siri Shortcuts** — "Hey Siri, capture buy milk" works on all Apple devices
2. **iOS Widget** — One-tap capture from home screen

---

## Phase 1: Siri Quick Capture

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    iCloud Shortcuts                      │
│              (One Shortcut, synced everywhere)           │
└─────────────────────────────────────────────────────────┘
         │              │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ iPhone  │   │   Mac   │   │  Watch  │   │   iPad  │
    │  Siri   │   │  Siri   │   │  Siri   │   │  Siri   │
    └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────┐
│            POST https://lifeordered.com/api/captures     │
│                   (with API key auth)                    │
└─────────────────────────────────────────────────────────┘
```

### Component 1a: API Key Authentication (Backend)

**New endpoints needed on Rails backend:**

```
POST   /api/capture-keys     — Generate new capture key
GET    /api/capture-keys     — List user's keys (for settings UI)
DELETE /api/capture-keys/:id — Revoke a key
```

**Key format:** `cap_` prefix + 24 character random string (e.g., `cap_a1b2c3d4e5f6g7h8i9j0k1l2`)

**Modify existing endpoint:**
- `POST /api/captures` — Accept `Authorization: Bearer cap_xxxxx` header as alternative to session cookie

**Database:** New `capture_keys` table
- `id` (primary key)
- `user_id` (foreign key)
- `key_hash` (bcrypt hash of key, never store plaintext)
- `name` (optional, e.g., "Siri Shortcut")
- `last_used_at` (timestamp)
- `created_at`, `updated_at`

### Component 1b: Settings UI (Mobile App)

**Location:** Settings tab → New "Siri Quick Capture" section

**UI Elements:**
1. Section header with explanation
2. "Generate Capture Key" button (if no key exists)
3. Key display with copy button (if key exists)
4. "Get Shortcut" button → Opens iCloud Shortcut link
5. "Revoke Key" button (destructive)

**Files to modify:**
- `app/(tabs)/settings.tsx` — Add new section
- `src/services/api/captureKeys.ts` — New API service (create, list, delete)
- `src/types/models.ts` — Add CaptureKey type

### Component 1c: Pre-built Shortcut

**Shortcut name:** "Quick Capture" or "Capture"

**Trigger phrases:**
- "Hey Siri, capture [thought]"
- "Hey Siri, quick capture"

**Shortcut actions:**
1. If no input provided → "Ask for Input" with prompt "What do you want to capture?"
2. "Get Contents of URL"
   - Method: POST
   - URL: `https://lifeordered.com/api/captures`
   - Headers: `Authorization: Bearer [CAPTURE_KEY]`, `Content-Type: application/json`
   - Body: `{"content": "[Provided Input]"}`
3. "Show Result" → "Captured: [input]"

**Setup import variable:** The Shortcut will prompt user to paste their API key on first run. Key is stored securely within Shortcut.

**Distribution:** Host on iCloud and link from app Settings UI.

---

## Phase 2: iOS Home Screen Widget

### Widget Sizes

**Small (2x2):**
```
┌─────────────────────┐
│  ✚ Quick Capture    │
└─────────────────────┘
```
- Tap → Opens app to capture screen

**Medium (4x2):**
```
┌─────────────────────────────────┐
│  Life | Ordered                 │
│  ───────────────────────────    │
│  ✚ Tap to capture               │
│  Recent: Buy milk, Call dentist │
└─────────────────────────────────┘
```
- Shows 2-3 recent captures
- Tap → Opens app to capture screen

### Technical Requirements

- **WidgetKit** (native Swift)
- **App Groups** for shared data between widget and app
- **Development build required** (no Expo Go)
- Uses `expo-apple-targets` or custom native module

### Files to create (native)

```
ios/
  LifeOrderedWidget/
    LifeOrderedWidget.swift       — Widget entry point
    LifeOrderedWidgetBundle.swift — Widget bundle
    QuickCaptureWidget.swift      — Small widget
    RecentCapturesWidget.swift    — Medium widget
    SharedDataManager.swift       — App Groups data access
```

### App-side changes

- Configure App Groups in app.json/app.config.js
- Write recent captures to shared container for widget to read
- Handle widget deep link (`lifeordered://widget-capture`)

---

## Implementation Order

| Step | Description | Effort |
|------|-------------|--------|
| 1a | Backend: API key endpoints | Low |
| 1b | Mobile: Settings UI for keys | Low |
| 1c | Create & host Shortcut | Low |
| 1d | Documentation for users | Low |
| 2a | Widget: Project setup & App Groups | Medium |
| 2b | Widget: Small widget implementation | Medium |
| 2c | Widget: Medium widget with recents | Medium |
| 2d | App: Write to shared container | Low |

---

## Verification

### Phase 1 Testing
1. Generate capture key in Settings
2. Copy key and install Shortcut
3. Test "Hey Siri, capture test item" on iPhone
4. Verify capture appears in My Stuff tab
5. Test same Shortcut on Mac (should sync via iCloud)
6. Revoke key and verify Shortcut stops working

### Phase 2 Testing
1. Add widget to home screen (both sizes)
2. Tap widget → Should open capture flow
3. Verify recent captures appear in medium widget
4. Create new capture → Widget should update

---

## Security Considerations

- API keys are hashed (bcrypt) in database, never stored plaintext
- Keys are scoped to capture creation only (can't read/delete other data)
- Keys can be revoked instantly from Settings
- `last_used_at` tracking helps users identify unused keys

---

## Future Possibilities

This API key infrastructure enables:
- Web capture page (`lifeordered.com/capture`)
- Browser extension
- Raycast/Alfred plugins
- CLI tool
- Zapier/IFTTT integration
