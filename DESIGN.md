# Design Guidelines

This document outlines the design principles and UI patterns used in this project, specifically following the structure established in the "Discover" (`/entdecken`) section.

## Layout Structure

All pages should be wrapped in the `AppShell` component to provide consistent navigation and branding.

### Header
Each page should feature a prominent header section:
- **Background**: `bg-card` with a bottom border `border-b border-border`.
- **Padding**: `px-6 py-8 md:px-10 md:py-12`.
- **Content Wrapper**: `max-w-5xl mx-auto`.
- **Elements**:
    - A subtitle/breadcrumb indicator using `text-xs font-bold uppercase tracking-widest text-primary`.
    - A main title (`h1`) using `text-3xl md:text-4xl font-black tracking-tight`.

## Sub-Pages (Secondary Pages)

Sub-pages (like `/entdecken/gastronomie`) use a more compact header design to prioritize content and provide easy navigation back to the parent section.

### Sub-Page Header
- **Background**: Same as main header (`bg-card`, `border-b`).
- **Padding**: `px-6 py-6` (consistent across all screen sizes).
- **Back Button**:
    - A `Link` component pointing to the parent page.
    - Styling: `p-2 hover:bg-muted rounded-full transition-colors`.
    - Icon: `ArrowLeft` (size 20).
- **Typography**:
    - **Subtitle**: `text-[10px] font-bold uppercase tracking-widest text-primary`.
    - **Main Title**: `text-xl font-black`.
- **Layout**:
    - Uses `flex items-center gap-4` for the back button and title group.
    - Title group uses `space-y-0.5`.

### Main Content area
- **Container**: `flex-1 overflow-y-auto p-6 md:p-10`.
- **Max Width**: Inner content should be wrapped in `max-w-5xl mx-auto`.
- **Sections**: Use `section` tags with `space-y-12` for vertical rhythm between major blocks.
- **Section Headings**: `h2` with `text-lg font-bold mb-6`.

## Typography

The project uses the **Inter** font family (`--font-sans`).
- **Headings**: Use `tracking-tight` and `font-black` for primary headings to give them a modern, bold look.
- **Body**: Standard `text-foreground`.
- **Subtle Text**: `text-muted-foreground`.

## UI Components

### Cards
- **Style**: `bg-card`, `border border-border`, `rounded-2xl`, `shadow-sm`.
- **Interactive**: For clickable cards, add `hover:border-primary/50 transition-all`.
- **Icons**: Use `lucide-react` icons. Inside cards, icons are often placed in a `w-12 h-12 rounded-xl` container with a semi-transparent background (e.g., `bg-primary/10 text-primary`).

### Forms and Interactions
- **Modals (Dialogs)**: By default, forms (creation, editing, details) should be implemented using **Modals**.
- **Exception**: Only use full-page forms if explicitly requested or if the form complexity justifies a dedicated route.

## Spacing and Grid
- Use Tailwind's standard spacing scale.
- Responsive grids: Typically `grid-cols-1 md:grid-cols-2` or `lg:grid-cols-3` for lists of items.
- Consistent gap of `gap-4` or `gap-6` between grid items.
