# RSVP Reader - Design Guidelines

## Design Approach

**Reference**: Custom system inspired by **joinpogo.com** (playful aesthetics/animations) + **Duolingo** (gamified engagement) + **Linear** (typography clarity)

**Rationale**: Transform utility-focused reading app into engaging, memorable experience through playful visual language while maintaining reading clarity during RSVP sessions.

## Core Design Principles

1. **Playful Engagement**: Vibrant, fun interface that makes speed reading feel exciting
2. **Visual Interest**: Floating decorative elements create depth and movement
3. **Reading Sanctity**: RSVP display remains distraction-free despite playful surrounding UI
4. **Micro-Delight**: Smooth animations and hover effects reward interaction

## Typography

**Font Families** (via Google Fonts CDN):
- Primary UI: Inter - weights 400, 500, 600, 700, 800
- RSVP Display: JetBrains Mono - weight 700
- Decorative Headlines: Inter Extra Bold (800) with tight letter-spacing

**Scale & Treatment**:
- Hero Headlines: text-5xl to text-7xl, font-extrabold, gradient text effect
- RSVP Display: text-6xl to text-9xl (user-adjustable)
- Section Headers: text-3xl to text-4xl, font-bold
- Card Titles: text-xl, font-semibold
- Body/Controls: text-base to text-lg
- Micro-copy: text-sm, font-medium

## Layout System

**Spacing Primitives**: Tailwind units of **3, 4, 6, 8, 12, 16, 20, 24**
- Compact spacing: gap-3, p-3 (tight button groups)
- Standard spacing: gap-6, p-6 (cards, containers)
- Generous spacing: gap-12, p-12 (sections)
- Hero spacing: py-20 to py-32 (landing areas)

**Container Strategy**:
- Marketing sections: max-w-7xl with generous padding
- Reading interface: max-w-3xl centered, min-h-screen
- Dashboard grid: 3-column (lg:grid-cols-3 md:grid-cols-2)

## Component Library

### Landing Page (Marketing)

**Hero Section**:
- Full viewport height (min-h-screen) with gradient background
- Large hero image: Illustration of person speed reading with floating book elements, positioned right side (60% width on desktop)
- Left content: Massive headline (text-6xl font-extrabold), subheadline, primary CTA button with gradient
- Floating decorative elements: 5-7 abstract book shapes, letter characters, speed meter icons positioned absolutely with subtle float animations
- Hero CTA buttons: Backdrop blur background (backdrop-blur-md), rounded-full (pill shape)

**Features Section** (3-column grid):
- Feature cards: Highly rounded corners (rounded-3xl), generous padding (p-8)
- Each card: Large icon (w-16 h-16) with gradient background, bold title, description
- Decorative accent: Small floating element (book/letter) per card with rotation animation
- Hover effect: Lift transform with shadow increase

**How It Works** (4 steps, horizontal timeline on desktop):
- Step cards: Connected with animated dotted lines
- Circular step numbers with gradient fills
- Icon + title + description per step
- Stagger-reveal animation on scroll

**Testimonials Section**:
- 2-column grid alternating layout
- Bubbly speech-bubble style cards (rounded-2xl with small tail)
- User avatar, quote, name/occupation
- Floating quotation mark decorative element

**CTA Section**:
- Centered content with gradient background
- Oversized button (h-16, px-12, rounded-full)
- Supporting text with feature highlights (3 inline pills)

### Navigation

**Top Bar**:
- Fixed header (h-20), backdrop blur effect
- Logo with playful icon (bouncing book animation on page load)
- Navigation links with pill-shaped hover backgrounds
- Account dropdown: Rounded-2xl, includes tier badge with gradient
- Mobile: Hamburger with full-screen overlay menu

### Dashboard

**Library Grid**:
- Book cards: Rounded-2xl, gradient border effect
- Card hover: Pronounced lift (translate-y-[-8px]), glow effect
- Content layout: Book cover thumbnail (rounded-xl), title, progress ring (circular, animated), quick actions
- Empty state: Large illustration with floating book elements, rounded-2xl upload zone with dashed gradient border

**Stats Bar** (above library):
- Horizontal pills showing: Books read, Total time, Avg WPM
- Each pill: Rounded-full, icon + number + label
- Animated counter on page load

### Reading Interface

**RSVP Display**:
- Centered container (max-w-3xl)
- Word display: Massive JetBrains Mono, neutral background for clarity
- ORP marker: Bold vertical accent line
- Minimal decorative elements: Subtle corner flourishes only (no floating elements during reading)

**Control Panel** (Fixed bottom):
- Wide rounded container (rounded-t-3xl), backdrop blur
- Layout: Flex with gap-6, centered
- Play/Pause: Large circular button (w-20 h-20, rounded-full) with icon morph animation
- WPM Badge: Pill-shaped, large text, gradient background
- Progress bar: Full-width, rounded-full, gradient fill with animated pulse at playhead
- Speed controls: Slide-up modal with oversized rounded slider, live preview

### Subscription

**Tier Comparison Table** (Dashboard if Free):
- 2-column card (rounded-3xl)
- Free vs Premium with checkmark/x icons
- Premium column: Gradient background
- Upgrade button: Prominent, rounded-full, gradient with animated shimmer effect

**Premium Badge** (Header):
- Gradient pill with sparkle icon
- Subtle pulse animation

### Forms & Inputs

**Upload Zone**:
- Large rounded-3xl container with gradient dashed border
- Drag-drop area with animated border on hover/drag
- File icon that animates on file selection
- Supported formats as colorful pills below

**Text Input**:
- Rounded-2xl with generous padding (p-4)
- Floating label animation
- Focus state: Gradient border appearance

### Authentication

**Login/Signup Card**:
- Centered (max-w-lg), rounded-3xl, p-12
- Decorative floating elements in background
- Google button: Rounded-full, icon + text
- Input fields: Rounded-xl with smooth focus transitions

## Decorative Elements Strategy

**Floating Elements**:
- Books: 3D-rotated rectangles, varied sizes (w-12 to w-24)
- Letters: Bold single characters, oversized, semi-transparent
- Speed indicators: Gauge/meter icons, speedometer graphics
- Positioning: Absolute, scattered across hero and section backgrounds
- Animation: Subtle float (translate-y), slow rotation, parallax on scroll

**Placement**:
- Hero: 7-10 elements, larger sizes
- Feature sections: 2-3 elements per section, smaller
- Reading interface: None (maintain focus)
- Dashboard: 3-4 subtle elements in header area only

## Animations & Micro-Interactions

**Page Load**:
- Logo bounce (duration-500)
- Hero elements stagger-fade-in (delay increments)
- Stats counter animation (number count-up effect)

**Hover States**:
- Cards: Lift + glow (duration-200)
- Buttons: Scale slight grow (scale-105) + shadow increase
- Navigation links: Pill background slide-in

**Active Reading**:
- RSVP word: Instant transition (no animation during reading)
- Progress bar: Smooth fill animation
- WPM change: Number morph effect

**Scroll-Triggered**:
- Feature cards: Stagger reveal (intersection observer)
- Decorative elements: Parallax movement (subtle depth)
- Timeline steps: Progressive appearance

## Images

**Hero Section**: Large illustration/photo showing speed reading in action - person with floating books/text elements around them, positioned on right 50-60% of viewport. Modern, vibrant, slightly stylized illustration style.

**Feature Icons**: Use Heroicons via CDN, placed in gradient circular containers (w-16 h-16)

**Book Covers**: User-uploaded thumbnails or placeholder gradient rectangles (aspect-ratio-2/3, rounded-xl)

**Decorative Illustrations**: Abstract book shapes, oversized letters, speed gauge graphics - simple SVG shapes with gradient fills, positioned absolutely throughout marketing pages

## Accessibility

- Focus indicators: Thick outline (3px) with offset on all interactive elements
- Reduced motion: Respect prefers-reduced-motion to disable decorative animations
- ARIA labels: All decorative elements marked aria-hidden="true"
- Reading interface: Maximum contrast, zero motion during RSVP display
- Touch targets: Minimum 48px for all interactive elements
- Keyboard navigation: Full support with visible focus states

## Visual Hierarchy

1. **RSVP word display** (dominant during reading, neutral background)
2. **Hero headline & CTA** (landing page entry point)
3. **Primary action buttons** (gradient, oversized)
4. **Feature cards & content sections** (structured hierarchy)
5. **Decorative elements** (background layer, lower opacity)
6. **Secondary actions & metadata** (subtle, accessible)