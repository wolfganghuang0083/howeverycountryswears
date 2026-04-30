# How Every Country Swears

A cultural guide to profanity around the world — 1,000 phrases from 100 countries with pronunciation, cultural context, and linguistic analysis.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Build**: Vite 6
- **Hosting**: Vercel (static SPA)
- **Routing**: Wouter (client-side)
- **UI**: shadcn/ui + Radix UI + Framer Motion

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Deployment

This project is configured for Vercel deployment:

1. Push to GitHub
2. Import the repository in Vercel
3. Vercel will auto-detect the Vite framework and deploy

## Project Structure

```
client/
  src/
    pages/          ← Page components (Home, Country, Phrase, Region, etc.)
    components/     ← Reusable UI components
    data/           ← JSON data files (countries, phrases)
    lib/            ← Utilities (data access, i18n, pronunciation)
    contexts/       ← React contexts (locale, theme)
    hooks/          ← Custom hooks
shared/             ← Shared constants and types
```

## Features

- 100 countries with 10 phrases each (1,000 total)
- Bilingual support (English + Traditional Chinese)
- Pronunciation via Web Speech API
- Social sharing (Twitter, Facebook, WhatsApp)
- Search across countries and phrases
- Responsive design (mobile-first)
- SEO-friendly with dynamic titles and meta tags

## Future Plans (Phase 2)

- [ ] User authentication (Auth.js)
- [ ] Community submissions and voting
- [ ] Rating system
- [ ] Points and badges gamification
- [ ] Database integration (Neon Postgres)
