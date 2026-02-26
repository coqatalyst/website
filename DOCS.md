# CoQatalyst Website Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Configuration](#configuration)
5. [Components](#components)
6. [Pages](#pages)
7. [Styling](#styling)
8. [Development](#development)
9. [Build and Deployment](#build-and-deployment)

---

## Project Overview

**CoQatalyst** is a teen-led science community website built to showcase and facilitate collaboration among young scientists. The platform hosts:

- **Science Exhibitions**: Real science exhibitions where teens showcase original research and experiments
- **Discord Community**: A collaborative space for asking questions, finding collaborators, and sharing findings
- **Research Guidance**: Peer-to-peer learning on experiment design, paper writing, and research navigation
- **Collaboration Hub**: Connecting teen scientists across multiple disciplines (biology, physics, CS, chemistry, environmental science, etc.)

### Key Features

- Home page with statistics, feature highlights, and testimonials
- Navigation-based routing system
- Community Discord integration
- Responsive design with mobile-friendly navigation
- Under-construction pages for future expansion (About, Blog, Contact)

---

## Architecture

The website uses **Astro** as the core framework, a modern static site builder that enables:

- Component-based architecture with `.astro` files
- Layout system for consistent page styling
- Client-side interactivity where needed
- Optimized static HTML generation

### High-Level Flow

```
User Request → Astro Router → Page Component → Layout → Components → Rendered HTML
```

---

## Directory Structure

```
. (root)
├── astro.config.mjs          # Astro configuration
├── package.json              # Project metadata and dependencies
├── README.md                 # Brief project overview
├── DOCS.md                   # This file
├── public/                   # Static assets
│   └── assets/               # Images and logos
│       ├── logo.png
│       └── logo-icon.png
└── src/                      # Source code
    ├── env.d.ts              # TypeScript environment types
    ├── components/           # Reusable UI components
    │   ├── Background.astro  # Animated background element
    │   ├── Footer.astro      # Site footer
    │   └── Nav.astro         # Navigation header with logo and menu
    ├── layouts/              # Page layouts/templates
    │   └── Base.astro        # Main layout wrapper
    ├── pages/                # Page routes (auto-routed by filename)
    │   ├── 404.astro         # 404 error page
    │   ├── index.astro       # Home page (route: /)
    │   ├── about.astro       # About page (under construction)
    │   ├── blog.astro        # Blog page (under construction)
    │   ├── contact.astro     # Contact page (under construction)
    │   └── under-construction.astro  # Placeholder for future pages
    └── styles/               # Global stylesheets
        └── global.css        # Global styling and CSS variables
```

---

## Configuration

### `astro.config.mjs`

```javascript
{
  base: '/website/',           // Base URL path for all requests
  redirects: {
    '/website/blog': '/website/under-construction',
    '/website/contact': '/website/under-construction',
    '/website/about': '/website/under-construction',
  }
}
```

**Key Settings:**

- **`base`**: The site runs under `/website/` base path, useful for subdirectory deployment
- **`redirects`**: Three pages currently redirect to an under-construction placeholder:
  - About page
  - Blog page
  - Contact page

This allows these routes to exist while showing a holding page until they're ready.

---

## Components

### `Nav.astro`

**Purpose**: Main navigation header with logo and menu links

**Props:**
- `currentPath` (string, optional): Current page route for active link highlighting

**Features:**
- Responsive navigation bar
- CoQatalyst logo with branding
- Menu links: Home, About, Blog, Contact
- Discord community integration button
- Mobile hamburger menu toggle (in nav-drawer)
- Active link highlighting based on current path

**Navigation Links:**
- Home: `/website/`
- About: `/website/about` (redirects to under-construction)
- Blog: `/website/blog` (redirects to under-construction)
- Contact: `/website/contact` (redirects to under-construction)
- Discord: `https://discord.gg/waitforsometimeig` (external)

### `Footer.astro`

**Purpose**: Site footer component

**Content**: Footer information (details expandable based on implementation)

### `Background.astro`

**Purpose**: Animated background element for visual enhancement

**Use**: Provides consistent visual styling across all pages

---

## Pages

### `index.astro` (Home Page)

**Route:** `/website/`

**Content Sections:**

1. **Statistics Section**
   - Teen Scientists count
   - Exhibitions count
   - Research Topics count
   - Curiosity metric
   
2. **Features Section** (4 main features)
   - **01 - Science Exhibitions**: Showcase research and experiments
     - Color: #226d0b (green)
   
   - **02 - Discord Community**: Collaboration and Q&A space
     - Color: #e88f1a (orange)
   
   - **03 - Research Guidance**: Peer-to-peer learning
     - Color: #dfa651 (tan)
   
   - **04 - Collaboration**: Cross-disciplinary connections
     - Color: #cb1b3a (red)

3. **Testimonials Section**
   - Multiple testimonial quotes from community members
   - Each includes: quote, name, and role
   - Placeholder content (Lorem ipsum) ready to be replaced with real testimonials

**Data Structure:**
- `stats`: Array of statistics objects with `value` and `label`
- `features`: Array of 4 feature objects with `num`, `title`, `desc`, `accent` color, and `icon` code
- `testimonials`: Array of testimonial objects with `quote`, `name`, and `role`

### `about.astro`

**Current Status**: Under construction

**Route:** `/website/about` → redirects to `/website/under-construction`

### `blog.astro`

**Current Status**: Under construction

**Route:** `/website/blog` → redirects to `/website/under-construction`

### `contact.astro`

**Current Status**: Under construction

**Route:** `/website/contact` → redirects to `/website/under-construction`

### `under-construction.astro`

**Purpose**: Placeholder page for routes not yet implemented

**Route:** `/website/under-construction`

**Usage**: Shows a holding page message when About, Blog, or Contact pages are accessed

### `404.astro`

**Purpose**: Error page for undefined routes

**Shows:** When a user navigates to a non-existent URL

---

## Styling

### `global.css`

**Contains:**
- Global reset and normalization
- CSS variables for consistent theming
- Base typography styles
- Component-specific styling
- Responsive breakpoints and media queries

**Key Styling Features:**
- Container classes for layout consistency
- Hide/show utilities for mobile responsiveness
  - `.hide-mobile`: Hidden on mobile devices
  - `.show-mobile`: Visible only on mobile devices
- Button styles (`.btn-primary`)
- Responsive navigation (desktop and mobile views)
- Background animations and effects

---

## Development

### Prerequisites

- Node.js (version 16+ recommended)
- npm or yarn package manager

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open in browser:
   ```
   http://localhost:3000/website/
   ```

### Development Features

- **Hot Module Replacement (HMR)**: Changes auto-update in browser
- **Live Browser Reload**: Page refreshes on file changes
- **TypeScript Support**: Type checking for `.astro` files and `.ts` files

### Key Development Files

- `package.json`: Project scripts and dependency versions
- `astro.config.mjs`: Route configuration and build settings
- `src/env.d.ts`: TypeScript type definitions for environment

### Making Changes

#### Adding a New Page

1. Create a new `.astro` file in `src/pages/`
   - Example: `src/pages/events.astro`
   - Route automatically becomes `/website/events` (relative to base URL)

2. Import the Base layout:
   ```astro
   ---
   import Base from '../layouts/Base.astro';
   ---
   
   <Base title="Events | CoQatalyst" currentPath="/events">
     <!-- Page content here -->
   </Base>
   ```

3. Add navigation link in `src/components/Nav.astro` if needed

#### Updating Navigation

Edit the `links` array in `src/components/Nav.astro`:
```JavaScript
const links = [
  { href: baseUrl, label: 'Home' },
  { href: baseUrl + 'about', label: 'About' },
  // Add more links here
];
```

#### Adding Components

1. Create a new `.astro` file in `src/components/`
2. Define component logic in the frontmatter (between `---` markers)
3. Add HTML template below the frontmatter
4. Import and use in pages or layouts

#### Styling Components

- Add styles within `<style>` tags in Astro components
- Use global classes from `global.css` for consistency
- All styles are scoped to the component by default (unless `is:global` is specified)

---

## Build and Deployment

### Build Process

```bash
npm run build
```

**Output:** Static HTML, CSS, and JavaScript files in `dist/` directory

**What Happens:**
- Astro compiles all `.astro` components to static HTML
- CSS is optimized and bundled
- JavaScript is tree-shaken and minified
- Final output is a completely static site ready for hosting

### Preview Production Build

```bash
npm run preview
```

**Purpose**: Test the production build locally before deploying

**URL:** Runs on local development server (typically `http://localhost:3000/website/`)

### Deployment

**Static Hosting Options:**
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file hosting service

**Base Path Consideration:**
The site is configured with `base: '/website/'`, meaning it expects to be deployed to a `/website/` subdirectory. Adjust the `base` setting in `astro.config.mjs` if deploying to a different path.

**Deployment Steps:**

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder to your hosting provider

3. Ensure the base URL matches your deployment path

---

## Common Tasks

### Update Homepage Statistics

Edit the `stats` array in `src/pages/index.astro`:

```astro
const stats = [
  { value: 'x+', label: 'Teen Scientists' },
  { value: 'x+', label: 'Exhibitions' },
  { value: 'x+', label: 'Research Topics' },
  { value: 'LOTS OF', label: 'Curiosity' },
];
```

### Add Testimonials

Edit the `testimonials` array in `src/pages/index.astro`:

```astro
const testimonials = [
  {
    quote: 'Actual testimonial text here',
    name: 'Person Name',
    role: 'Their role/title',
  },
  // Add more testimonials
];
```

### Enable About/Blog/Contact Pages

1. Remove the redirect from `astro.config.mjs`
2. Add actual content to the respective `.astro` files
3. Update navigation styling if needed

### Add Favicon

Replace `logo-icon.png` in `public/assets/` with your icon file (ensure it matches the same filename).

---

**Last Updated:** February 2026  
**Version:** 0.1.0
