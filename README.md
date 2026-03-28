# Marketeer

an AI-powered marketing campaign generator. upload or generate a logo, get it analyzed, then receive a full campaign with banners, jingles, video ads, and voiceovers.

## how it works

1. choose to upload a logo or have one generated
2. go through onboarding: location, industry, competitor logos
3. get an AI analysis of your logo with improvement suggestions
4. approve a generated campaign brief (tagline, banner concepts, jingle, video scenes, voiceover script)
5. view and download all assets from the dashboard

## tech stack

- Next.js (app router), React, TypeScript
- Tailwind CSS, Framer Motion, shadcn/ui
- Google Gemini API for text and image generation
- Veo API for video generation
- FFmpeg WASM for client-side video/audio merging
- IndexedDB for campaign persistence

## setup

```bash
npm install
```

create a `.env.local` file:

```
GEMINI_API_KEY=your_key_here
```

run the dev server:

```bash
npm run dev
```

then open `http://localhost:3000`.

## generated assets

- 3 marketing banners (1:1, 16:9, 9:16)
- 30 second audio jingle
- video ad with voiceover
- all downloadable as a ZIP
