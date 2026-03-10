# Life | Ordered - Design Guidelines

## Design Approach
**System:** Hybrid approach drawing from Linear's typography clarity, Things 3's spatial elegance, and Material Design's interaction patterns. This is a utility-first productivity app requiring clean information hierarchy and effortless navigation.

## Typography System
- **Primary Font:** Inter (400, 500, 600 weights)
- **Hierarchy:**
  - Page titles: text-2xl font-semibold
  - Section headers: text-lg font-medium
  - List items/tasks: text-base font-normal
  - Labels/metadata: text-sm font-medium
  - Supporting text: text-xs

## Layout System
**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, 8, 12
- Mobile container: px-4, py-3
- Card padding: p-4
- List item gaps: space-y-2
- Section spacing: mb-6 to mb-8
- Icon-text gaps: gap-2

**Mobile-First Grid:**
- Single column base layout
- Bottom navigation (fixed): h-16 with safe-area-inset
- Top header (sticky): h-14
- Content area: Fills viewport between header/nav

## Component Library

### Navigation
**Bottom Tab Bar** (fixed, 5 items max):
- Icons above labels, text-xs
- Active state: Icon filled + label emphasis
- Height: 16 with inner padding p-2
- Tab spacing: justify-around

**Top Header:**
- Title centered or left-aligned with back button
- Action buttons (right): Icon-only, p-2 tap targets
- Sticky positioning with subtle bottom border

### Calendar View (Habit Tracking)
**Month Grid:**
- 7-column grid (Su-Sa headers)
- Square cells with aspect-square
- Cell size: Responsive based on viewport (min 40px)
- Date number: Absolute positioned top-left text-xs
- Habit indicator: Centered dot or checkmark (w-2 h-2)
- Current day: Ring indicator
- Selected day: Filled background

**Month Selector:**
- Horizontal scroll or swipe navigation
- Current month prominent with text-base font-medium
- Adjacent months text-sm with reduced opacity
- Chevrons for prev/next navigation

**Habit Legend:**
- Horizontal scroll chips showing tracked habits
- Each chip: rounded-full px-3 py-1.5 with habit color indicator dot
- Tap to filter calendar view

### Task/List Components
**Task Card:**
- Checkbox (w-5 h-5) with rounded corners
- Task text truncates with text-ellipsis
- Subtasks indented with pl-6
- Metadata row: Due date, tags (text-xs, gap-2)
- Swipe actions: Complete, Delete (mobile gesture)

**Goal/Habit Card:**
- Progress bar: h-1.5 rounded-full
- Icon + Title + Streak counter layout
- Compact stat display: grid grid-cols-3 gap-2
- Tap area: Entire card (min-h-16)

**Quick Add FAB:**
- Fixed bottom-right (with bottom-24 offset for nav bar)
- Circular: w-14 h-14 rounded-full
- Plus icon centered
- Expandable speed dial for task/habit/goal types

### Forms & Inputs
**Input Fields:**
- Full-width with rounded-lg
- Label above: text-sm font-medium mb-1.5
- Height: h-12 with px-4
- Focus state: Ring emphasis

**Date/Time Pickers:**
- Native mobile inputs with custom styling
- Icon prefix (calendar/clock)

**Toggles & Checkboxes:**
- Large tap targets: min-w-12 min-h-12 flex items-center
- iOS-style toggles for settings

### Data Displays
**Stats Dashboard:**
- Card grid: grid-cols-2 gap-3
- Stat cards: aspect-[4/3] with centered content
- Large number: text-3xl font-semibold
- Label below: text-xs

**Countdown Timers:**
- Circular progress indicator
- Days/hours prominent: text-2xl
- Event name: text-sm below
- Grid layout: grid-cols-2 for multiple countdowns

### Overlays
**Bottom Sheets** (primary modal pattern):
- Slide up from bottom
- Rounded top corners: rounded-t-2xl
- Drag handle: Centered horizontal bar (w-12 h-1)
- Max height: 90vh with scrollable content
- Backdrop overlay with reduced opacity

**Action Sheets:**
- List of tappable actions (min-h-12 each)
- Destructive actions separated with divider
- Cancel button prominent at bottom

## Interaction Patterns
- **Swipe gestures:** Left swipe on tasks reveals actions
- **Pull to refresh:** Top of scrollable lists
- **Long press:** Reorder mode for tasks/habits
- **Tap feedback:** Subtle scale animation (0.98) on pressable items
- **Loading states:** Skeleton screens matching content structure

## Animations
Minimal and purposeful:
- Page transitions: Slide (300ms ease-out)
- Modal entry: Slide up with backdrop fade
- Task completion: Checkbox checkmark draw + subtle confetti burst
- Calendar navigation: Crossfade between months (200ms)

## Images
**No hero images.** This is a productivity utility app. Use illustrative icons and custom graphics for:
- Empty states: Simple line illustrations (max 120px) with encouraging copy
- Onboarding: Feature spotlight illustrations (160px height)
- Achievement badges: Small celebratory icons when milestones hit

All graphics should be SVG-based, monochromatic with accent fill, maintaining minimal visual weight.