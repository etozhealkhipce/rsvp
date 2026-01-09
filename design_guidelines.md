# RSVP Reader - Design Guidelines

## Design Approach

**System**: Custom minimal design system inspired by **Linear** (typography/spacing) + **Pocket** (reading focus) + **Notion** (content organization)

**Rationale**: Utility-first application requiring distraction-free reading experience with clear information hierarchy for library management and subscription features.

## Core Design Principles

1. **Reading-First**: Minimize visual noise during RSVP sessions
2. **Clarity**: Instant comprehension of subscription status and controls
3. **Performance Feel**: Fast, responsive interactions matching app's speed-reading purpose

## Typography

**Font Families** (via Google Fonts CDN):
- Primary: Inter (UI, controls, navigation) - weights 400, 500, 600
- Reading Display: JetBrains Mono (for RSVP word display) - weight 700
- Fallback system fonts for performance

**Scale**:
- RSVP Display: text-6xl to text-8xl (adjustable)
- Page Headers: text-3xl (semibold)
- Section Headers: text-xl (medium)
- Body/Controls: text-base
- Metadata/Labels: text-sm (medium)

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 8, 12, 16**
- Tight spacing: gap-2, p-2 (control groups)
- Standard spacing: gap-4, p-4 (cards, buttons)
- Section spacing: gap-8, p-8 (content areas)
- Page margins: p-12 or p-16 (main containers)

**Grid Strategy**:
- Dashboard Library: 3-column grid (lg:grid-cols-3 md:grid-cols-2 grid-cols-1)
- Reading Interface: Single-column centered (max-w-4xl)
- Settings Panel: 2-column form layout (lg:grid-cols-2)

## Component Library

### Navigation
- **Top Bar**: Fixed header with logo, library link, account dropdown, subscription badge
- Height: h-16
- Account dropdown shows tier status (Free/Premium) with visual indicator

### Dashboard
- **Book Cards**: Rounded corners (rounded-lg), subtle shadow, hover lift effect
- Card content: Cover placeholder (if available), title (font-semibold), progress bar, last read timestamp, quick actions
- Empty state: Centered illustration placeholder with upload CTA

### Reading Interface
- **RSVP Display Area**:
  - Centered container: max-w-2xl, min-h-screen flex items-center
  - Word display: Massive text (responsive 4xl-8xl), monospace font
  - ORP marker: Red vertical line (w-0.5 bg-red-500) positioned at calculated focal point
  - Background: Minimal, zero distractions

- **Control Panel** (Bottom fixed):
  - Translucent background (backdrop-blur-md)
  - Layout: Centered flex with gap-4
  - Play/Pause: Large circular button (w-16 h-16)
  - WPM Display: Prominent badge showing current speed
  - Progress: Thin horizontal bar spanning width
  - Settings icon: Opens speed/font controls in slide-up modal

### Forms & Inputs
- **File Upload**: Drag-and-drop zone with dashed border (border-2 border-dashed), rounded-xl, p-8
- Accepted formats badge: Small pill showing ".pdf, .txt"
- **Text Paste Area**: Full-width textarea, rounded-lg, min-h-48

### Subscription
- **Tier Badge**: Pill-shaped, positioned in header
  - Free: Muted styling
  - Premium: Gradient background with icon
- **Upgrade CTA**: Prominent card in dashboard if Free tier, showing feature comparison table (2-column: Free vs Premium)

### Settings Modal
- **Speed Controls**: Large slider with WPM labels at intervals
- **Gradual Start Toggle**: Switch component with explanation text
- **Font Size**: Slider with live preview
- Typography: Clean labels (text-sm font-medium), descriptions (text-sm text-gray-600)

### Authentication
- **Login/Signup**: Centered card (max-w-md), rounded-2xl, p-8
- Google Auth button: Full-width with icon, outlined style
- Email/password fields: Rounded inputs with floating labels

## Accessibility
- Focus states: 2px outline offset on all interactive elements
- Keyboard navigation: Tab through controls, Space/Enter for actions
- Screen reader: ARIA labels for RSVP state, progress percentage
- Consistent 44px minimum touch targets for mobile

## Animations
**Minimal, purposeful only**:
- Card hover: Subtle translate-y lift (2-4px)
- RSVP word transitions: Instant (no fade), only pause duration changes
- Control panel: Slide-up/down (duration-300)
- Loading states: Simple spinner, no skeleton screens

## Images

**No hero image** - This is a utility application focused on reading functionality.

**Icon Library**: Heroicons (outline style) via CDN
- Navigation, controls, file types, settings icons

**Placeholders**:
- Book covers: Generic document icon or user-uploaded thumbnails (aspect-ratio-3/4)
- Empty states: Simple SVG illustrations (upload, empty library)

## Visual Hierarchy

1. RSVP word during reading session (dominates viewport)
2. Control panel actions (fixed, accessible)
3. Library organization (cards with clear metadata)
4. Subscription status (persistent but non-intrusive)
5. Settings/account (secondary, accessible via dropdown)