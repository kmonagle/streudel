# iOS Share Extension - Quick Start Guide

## What You Have Now

✅ iOS Share Extension implemented
✅ Android SEND intent filter configured
✅ Deep linking set up
✅ ShareContext for managing shared content
✅ ProcessCaptureDialog for converting captures
✅ Captures section in My Stuff screen

## How to Build & Test

### 1. Prerequisites

Ensure you have:
- ✅ EAS CLI: `npm install -g eas-cli`
- ✅ EAS login: `eas login`
- ✅ Apple Developer account
- ✅ Backend captures API deployed (required!)

### 2. Build for Android

```bash
# Development build (for testing)
eas build --profile development --platform android

# When ready, install the APK on your device
```

**Testing Android:**
1. Open any app (Chrome, Messages, etc.)
2. Select text and tap Share
3. Choose "Life Ordered"
4. App opens with capture created
5. Check My Stuff > Captures section

### 3. Build for iOS

```bash
# Development build (for testing)
eas build --profile development --platform ios

# Install on device via TestFlight or direct install
```

**Testing iOS:**
1. Open Safari or Notes
2. Share a URL or text
3. Scroll to find "Life | Ordered" in share sheet
4. Tap it
5. App opens with capture created
6. Check My Stuff > Captures section

### 4. Backend Setup Required

Before testing, deploy these API endpoints:

```typescript
// POST /api/captures
{
  content: string,
  source?: string,
  url?: string
}

// GET /api/captures
// Returns: Capture[]

// DELETE /api/captures/:id
// Returns: void
```

Database schema:
```sql
CREATE TABLE captures (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  source VARCHAR(255),
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Common Issues

### Issue: "Life Ordered" doesn't appear in share sheet

**Android**: You need to install the EAS build with the SEND intent filter
**iOS**: You need the EAS build with Share Extension (doesn't work in Expo Go)

### Issue: App crashes when sharing

**Check**: Is the backend captures API running and accessible?
**Check**: Are you logged in? (Captures require authentication)

### Issue: Build fails

**Try**:
```bash
# Clear cache and rebuild
eas build --clear-cache --profile development --platform ios
```

## File Structure

```
ios/ShareExtension/
├── ShareViewController.swift    # Main Swift code
├── Info.plist                   # Extension config
├── MainInterface.storyboard    # UI (minimal)
└── README.md                    # Detailed docs

plugins/
└── withShareExtension.js       # Expo config plugin

app/(tabs)/mystuff.tsx           # Captures section
src/contexts/ShareContext.tsx    # Share state management
src/components/ProcessCaptureDialog.tsx  # Convert UI
src/services/api/captures.ts    # API client
```

## Testing Checklist

### Android
- [ ] Build completes successfully
- [ ] Install on device
- [ ] Share text from Chrome → "Life Ordered" appears
- [ ] Tap "Life Ordered" → App opens
- [ ] Capture appears in My Stuff
- [ ] Process capture → Creates task
- [ ] Task appears in correct section

### iOS
- [ ] Build completes successfully
- [ ] Install on device (physical device, not simulator)
- [ ] Share from Safari → "Life | Ordered" in share sheet
- [ ] Tap "Life | Ordered" → Extension opens then main app
- [ ] Capture appears in My Stuff
- [ ] Process capture → Creates goal
- [ ] Goal appears in correct section

## Next Steps

Once both platforms work:

1. **Test with various apps**:
   - Messages, Email, Notes, Chrome, Safari
   - Twitter, Reddit, Slack (if installed)
   - Verify source attribution works

2. **Test edge cases**:
   - Very long text (>1000 characters)
   - URLs with special characters
   - Empty shares (should be rejected)
   - Multiple rapid shares

3. **Polish**:
   - Add loading states during capture creation
   - Add error handling for network failures
   - Add retry logic
   - Add success feedback

4. **Optional enhancements**:
   - Image sharing with OCR
   - Smart categorization (AI suggests task vs. goal)
   - Batch processing multiple captures
   - Capture templates

## Support

**iOS Share Extension Details**: See `ios/ShareExtension/README.md`

**Config Plugin**: See `plugins/withShareExtension.js`

**Deep Linking**: Configured in `app/_layout.tsx`

**Share Flow**: ShareContext → Captures API → My Stuff → ProcessCaptureDialog → Tasks/Goals/Habits

## Build Time Estimate

- **Android build**: ~15-20 minutes
- **iOS build**: ~25-30 minutes
- **Testing per platform**: ~15 minutes
- **Total**: ~1.5-2 hours for full testing on both platforms

## Ready to Build?

```bash
# Build both platforms
eas build --profile development --platform all

# Or build individually
eas build --profile development --platform android
eas build --profile development --platform ios
```

Good luck! 🚀
