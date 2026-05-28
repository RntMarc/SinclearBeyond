# Sinclear Beyond Design System

This document outlines the visual identity and design principles for "Sinclear Beyond" – a modern, immersive social hub.

## 1. Vision & Atmosphere
The UI is designed to feel like "Spotify meets a creative Startup". It is bold, emotional, and social-first.
- **Dark-First:** A unified immersive dark experience. No light mode.
- **Bold Modern UI:** Large typography, high contrasts, and clear hierarchy.
- **Retro-Futurism:** Y2K accents, neon glows, and noise textures.

## 2. Core Palette
A curated, high-contrast palette for maximum impact.
- **Background:** `oklch(0.12 0.02 260)` (Deep Night Blue)
- **Primary:** `oklch(0.85 0.22 135)` (Neon Lime)
- **Secondary:** `oklch(0.6 0.3 300)` (Electric Purple)
- **Accent:** `oklch(0.7 0.3 340)` (Vibrant Magenta)
- **Info/Blue:** `oklch(0.6 0.25 250)` (Electric Blue)

## 3. Typography
- **Headlines:** **Syne** (Font-weight 700/800). Large, uppercase, tracking-tighter, editorial style.
- **UI & Body:** **Plus Jakarta Sans**. Modern, highly readable, variable weights.
- **Labels:** Small, uppercase, tracking-widest (0.2em), font-black.

## 4. Components
### Cards (Glassmorphism)
- Deep layering with `bg-card/60` and `backdrop-blur-xl`.
- Rounded corners: `rounded-3xl` or `rounded-[2rem]`.
- Subtle internal borders: `border-white/5`.
- Strong elevation shadows.

### Buttons (Pill-shaped)
- Rounded-full (Pill).
- Bold weights & vibrant colors.
- Soft-glow effects matching the variant color.
- Active state: `scale-95`.

### Navigation (Mobile-First)
- **Mobile:** Floating bottom navigation bar with 5 core categories + "More" drawer. FABs are moved to `bottom-24` on mobile to avoid overlap.
- **Desktop:** Minimalist sidebar with grouped categories (Main, Organization, Content, System, Admin) and glassmorphism effect.

## 5. Visual Accents
- **Noise Texture:** A subtle global noise overlay (3% opacity) for a tactile, high-end feel.
- **Glow Effects:** Soft halos behind primary elements and headlines.
- **Stickers:** Asymmetric, rotated badge elements for subtitles and status indicators.
- **Gradients:** Deep, colorful background blur gradients (Neon Lime & Electric Purple).
- **Seasonal Effects:**
  - **Winter (Dec-Jan):** Snow particle overlay and snowflake accents.
  - **Pride Month (June):** Rainbow gradient for logo/active navigation, animated rainbow text (`animate-rainbow`), and falling pride symbols (`PrideEffect`).

## 6. Implementation Rules
- **Layering:** Use absolute positioning and blur for depth.
- **Motion:** Micro-interactions (hover scale, active scale) are mandatory for all interactive elements.
- **Consistency:** Always use the defined CSS variables and utility classes (`btn-pill`, `glass-card`, `sticker`).
- **Responsive:** Mobile-first thinking for all new components.
