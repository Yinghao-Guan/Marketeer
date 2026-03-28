# Marketeer — Technical Spec

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 16 (App Router) | Frontend + API routes in one framework. Turbopack for dev, React Compiler enabled. |
| **Language** | TypeScript | Type safety across frontend and API routes |
| **Styling** | Tailwind CSS 4 | Utility-first via `@tailwindcss/postcss`. No `tailwind.config.ts` — Tailwind 4 uses PostCSS-based config. |
| **UI Components** | shadcn/ui | Clean component primitives (buttons, cards, inputs) |
| **Animations** | Framer Motion + custom WebGL | LiquidEther (fluid sim) and DomeGallery (Three.js dome) for backgrounds; Framer Motion LayoutGroup for puzzle transitions |
| **3D / WebGL** | Three.js | Powers the DomeGallery storefront photo dome on the landing page |
| **Icons** | lucide-react | SVG icon components used across the UI |
| **Display Font** | Dirtyline 36daysoftype 2022 (local, `public/fonts/`) | Decorative font for "Marketeer" title. Bundled as woff2 via `next/font/local`. |
| **AI SDK** | @google/genai | Single SDK for all Google GenMedia models |
| **Video/Audio Merge** | @ffmpeg/ffmpeg (WASM) | Client-side video+voiceover merge, no server dependency |
| **Local Storage** | IndexedDB (via idb library) | Persist campaign data in the browser across sessions |
| **Deployment** | Vercel | One-click deploy for Next.js |

**Documentation links:**
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://motion.dev)
- [Three.js](https://threejs.org/docs/)
- [@google/genai SDK](https://www.npmjs.com/package/@google/genai)
- [@ffmpeg/ffmpeg WASM](https://www.npmjs.com/package/@ffmpeg/ffmpeg)
- [idb (IndexedDB wrapper)](https://www.npmjs.com/package/idb)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Runtime & Deployment

- **Runtime:** Node.js 20+
- **Deployment:** Vercel (free tier — 60s serverless timeout, sufficient for most routes)
- **Environment variables:** `GEMINI_API_KEY` in `.env` (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- **Demo:** Live URL on Vercel + screen recording for Devpost submission

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                         │
│  React Pages ──→ IndexedDB (campaign state)             │
│       │                                                 │
│       │  FFmpeg WASM (merge video + voiceover)          │
│       │                                                 │
└───────┼─────────────────────────────────────────────────┘
        │ fetch() calls
        ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (Vercel)                 │
│                                                         │
│  /api/analyze-logo      → Gemini Vision (text response) │
│  /api/generate-logo     → Nano Banana (base64 PNG)      │
│  /api/improve-logo      → Nano Banana (base64 PNG)      │
│  /api/generate-proposal → Gemini LLM (text response)    │
│  /api/generate-banners  → Nano Banana ×3 (base64 PNGs)  │
│  /api/generate-jingle   → Lyria WebSocket (PCM audio)   │
│  /api/generate-video    → Veo async (operation ID)       │
│  /api/check-video       → Veo poll (MP4 when ready)     │
│  /api/generate-voiceover→ TTS (base64 PCM audio)        │
│                                                         │
└───────┼─────────────────────────────────────────────────┘
        │ @google/genai SDK
        ▼
┌─────────────────────────────────────────────────────────┐
│              GOOGLE GENAI APIs                           │
│                                                         │
│  Gemini Vision  │ Nano Banana │ Lyria │ Veo │ TTS      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User inputs** (logo image, competitor images, location, industry) → stored in IndexedDB + passed to API routes as needed
2. **Logo analysis** → user's logo + competitor images sent to `/api/analyze-logo` → Gemini Vision returns rating + reasoning as JSON
3. **Logo generation/improvement** → prompt sent to `/api/generate-logo` or `/api/improve-logo` → Nano Banana returns base64 PNG → stored in IndexedDB
4. **Style Lock** → client-side: extract dominant colors from approved logo using canvas API → store color palette in IndexedDB → inject into all subsequent generation prompts
5. **Campaign proposal** → brand info + style lock + competitor analysis sent to `/api/generate-proposal` → LLM returns structured JSON (tagline, banner concepts, jingle mood, video scene, voiceover script)
6. **Asset generation** → proposal details sent to respective API routes → each returns generated media → stored in IndexedDB
7. **Video + voiceover merge** → client-side FFmpeg WASM combines MP4 + PCM audio → final MP4 stored in IndexedDB
8. **Download** → assets pulled from IndexedDB → zipped client-side (JSZip) → downloaded

## Frontend Pages

Implements `prd.md > Onboarding & Brand Input`, `prd.md > Logo Rating & Improvement`, `prd.md > Campaign Proposal`, `prd.md > Loading & Progress`, `prd.md > Campaign Dashboard`

### Landing Page (`app/page.tsx`)
- Split layout: DomeGallery (WebGL dome of storefront photos, desktop only) on left ~70%, branding + CTA on right ~30%
- LiquidEther animated fluid background behind CTA panel (purple/pink tones)
- App name "Marketeer" in Dirtyline display font with animated gradient
- Subtitle: "Marketing campaigns for small businesses"
- Rotating business type ticker (restaurants, coffee shops, boutiques, barbershops, bakeries, etc.)
- CTA: "Big-agency marketing without the big-agency budget."
- Single CTA button: "Get Started" (primary, white) → `/onboarding`
- "View past campaigns" link → `/history`
- Hackathon partner logo carousel at bottom (LogoLoop component: Glitch Club, Gemini, UCLA)

### Onboarding Flow (`app/onboarding/page.tsx`)
Single page with a 4-step puzzle UI. Each step is a section component rendered inside a PuzzleBlock. Completed steps collapse into clickable chips; the active step is shown full-size. Uses Framer Motion LayoutGroup + AnimatePresence for smooth layout transitions. Progress dots at the top show current position.

**Steps (in order):**
1. **Logo** (LogoSection) — Drag-and-drop upload via FileUpload component. Preview of uploaded image. "Continue" button advances to next step. "Skip — generate one for me" link skips upload; logo will be AI-generated on the rating page instead.
2. **Rivals** (CompetitorSection) — Multi-file upload for competitor logos/marketing material. Gallery preview of all uploads.
3. **Location** (LocationSection) — Text input for business city/region.
4. **Industry** (IndustrySection) — Grid of 10 selectable categories: Restaurant / Food & Drink, Retail / Shopping, Tech / Software, Health & Wellness, Education, Real Estate, Political Campaign, Entertainment / Events, Professional Services, Other (with text input).

**Step 5 — Review grid:** After all 4 steps, a 2×2 card grid displays all inputs. Clicking any card re-opens that step for editing. "Generate Campaign" button saves data to sessionStorage and navigates to `/rating`.

**State management:** Uses `useReducer` with a step state machine (steps 0–4). Data is held in component state during onboarding, then written to sessionStorage on submit.

**Unused pages:** `app/onboarding/brand-name/page.tsx` and `app/onboarding/describe/page.tsx` exist but are not part of the active flow.

### Logo Rating (`app/rating/page.tsx`)
Implements `prd.md > Logo Rating & Improvement`

- Displays the user's logo (uploaded or generated)
- Shows overall rating (1-10 scale) with visual indicator
- Shows per-format ratings:
  - Banner effectiveness
  - Video ad effectiveness
  - Social media effectiveness
- Each rating includes specific reasoning text
- If improvements suggested: shows action cards with "Apply this improvement" buttons
- "Approve & Continue" button → `/proposal`
- For Path B (no logo): generates a logo first via `/api/generate-logo`, then shows the same rating screen

### Campaign Proposal (`app/proposal/page.tsx`)
Implements `prd.md > Campaign Proposal` + `prd.md > Asset Generation` + `prd.md > Loading & Progress`

- Fetches a creative brief from `/api/generate-proposal` on load
- Single-page layout showing:
  - **Tagline** — large, prominent text
  - **Banner concept** — descriptive sentence
  - **Jingle mood** — genre and energy description
  - **Video scene** — camera angle, setting, action description
  - **Voiceover script** — the actual words to be spoken
- "Revise" button → re-calls `/api/generate-proposal` with change requests
- "Looks good, generate it all" button → triggers **inline generation** with 5-step progress tracker:
  1. "Crafting your banners..." (Nano Banana ×3)
  2. "Composing your jingle..." (Lyria)
  3. "Filming your ad..." (Veo — with polling)
  4. "Recording your voiceover..." (TTS)
  5. "Putting it all together..." (FFmpeg WASM merge)
- Generation progress is persisted to sessionStorage so partial results survive refresh
- Saves completed campaign to IndexedDB via `lib/store.ts`, then navigates to `/dashboard`

### Generation Progress (`app/generating/page.tsx`)
**Note: This page exists but is orphaned — no other page routes to it.** Generation is handled inline on the Proposal page (see above).

- Staged timed animations showing banners → video → jingle with accent color transitions
- Auto-navigates to `/dashboard` when animation sequence completes

### Campaign Dashboard (`app/dashboard/page.tsx`)
Implements `prd.md > Campaign Dashboard`

- Loads campaign from IndexedDB (by `?id=` query param or latest campaign)
- Logo displayed at top
- Banner gallery — all 3 formats in a responsive grid, click to expand
- Audio player for jingle with play/pause controls
- Video player for the final ad (video + voiceover merged via FFmpeg WASM)
- Tagline and voiceover script displayed as text
- Each asset has a "Regenerate" button
- "Download All" button — bundles everything into a zip (JSZip)
- Individual download buttons per asset
- Links back to landing page and campaign history

### Campaign History (`app/history/page.tsx`)
- Lists all saved campaigns from IndexedDB
- Shows banner preview (1:1 square), industry, location, and creation date for each
- Click a campaign to open it in the dashboard
- Delete campaigns with confirmation dialog
- Accessible from landing page ("View past campaigns") and dashboard

### Dev Helper (`app/dev/page.tsx`)
- Development-only page to seed sessionStorage with mock campaign data
- Allows jumping directly to any page in the flow for testing
- Visit: `http://localhost:3000/dev`

## API Routes

Implements `prd.md > Logo Rating & Improvement`, `prd.md > Campaign Proposal`, `prd.md > Asset Generation`

### Shared: Gemini Client (`lib/gemini.ts`)
```typescript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export default ai;
```

### POST `/api/analyze-logo`
Implements `prd.md > Logo Rating & Improvement`

**Request:**
```json
{
  "logoBase64": "string (base64 PNG)",
  "competitorLogosBase64": ["string (base64 PNG)", ...],
  "industry": "string",
  "location": "string"
}
```

**What it does:**
- Sends user logo + competitor logos to Gemini Vision (`gemini-2.5-flash`)
- Prompt asks for: overall rating (1-10), per-format ratings (banner, video, social), reasoning for each, specific improvement suggestions, comparison to competitors
- Uses structured output (JSON mode) for reliable parsing

**Response:**
```json
{
  "overallRating": 7.5,
  "formatRatings": {
    "banner": { "score": 8, "reasoning": "Bold colors pop at small sizes..." },
    "video": { "score": 6, "reasoning": "Too much detail for motion..." },
    "social": { "score": 8, "reasoning": "Clean and recognizable..." }
  },
  "improvements": [
    {
      "suggestion": "Simplify the icon for better video performance",
      "marketingReason": "Simpler logos retain recognition in motion at any speed",
      "priority": "high"
    }
  ],
  "competitorAnalysis": {
    "colorOverlap": "Your blue palette is similar to competitor #1",
    "differentiation": "Consider warmer tones to stand apart"
  }
}
```

### POST `/api/generate-logo`
**Request:**
```json
{
  "industry": "string",
  "location": "string",
  "competitorAnalysis": "string (from analyze step)",
  "brandDescription": "string (optional)"
}
```

**What it does:**
- Calls Nano Banana 2 (`gemini-3.1-flash-image-preview`) with `responseModalities: ['IMAGE', 'TEXT']`
- Prompt includes industry context, location, and instructions to avoid competitor colors/styles
- `imageConfig: { aspectRatio: '1:1' }` for logo

**Response:**
```json
{
  "imageBase64": "string (base64 PNG)",
  "description": "string (AI description of what it generated)"
}
```

### POST `/api/improve-logo`
**Request:**
```json
{
  "logoBase64": "string (base64 PNG)",
  "improvement": "string (the specific suggestion to apply)",
  "styleLock": { "colors": ["#hex", ...], "style": "string" }
}
```

**What it does:**
- Sends current logo + improvement instructions to Nano Banana
- Nano Banana edits the logo based on the suggestion

**Response:** Same shape as `/api/generate-logo`

### POST `/api/generate-proposal`
Implements `prd.md > Campaign Proposal`

**Request:**
```json
{
  "brandName": "string",
  "industry": "string",
  "location": "string",
  "styleLock": { "colors": ["#hex", ...], "style": "string" },
  "competitorAnalysis": "object",
  "logoDescription": "string",
  "revisionFeedback": "string (optional, for revisions)"
}
```

**What it does:**
- Calls Gemini LLM (`gemini-2.5-flash`) with structured output
- Prompt crafts a complete creative brief based on all brand context
- If `revisionFeedback` is provided, adjusts the previous proposal

**Response:**
```json
{
  "tagline": "string",
  "bannerConcept": "string",
  "jingleMood": "string (genre, energy, tempo description)",
  "videoScene": "string (camera angles, setting, action, lighting)",
  "voiceoverScript": "string (the actual words TTS will say)",
  "voiceTone": "string (warm, bold, energetic, etc.)"
}
```

### POST `/api/generate-banners`
Implements `prd.md > Asset Generation` (banners)

**Request:**
```json
{
  "bannerConcept": "string (from proposal)",
  "styleLock": { "colors": ["#hex", ...], "style": "string" },
  "logoBase64": "string",
  "brandName": "string"
}
```

**What it does:**
- Makes 3 parallel calls to Nano Banana 2 (`gemini-3.1-flash-image-preview`)
- Each call uses a different `aspectRatio`: `"1:1"`, `"16:9"`, `"9:16"`
- All prompts include Style Lock colors and banner concept from proposal
- All at 1K resolution

**Response:**
```json
{
  "banners": [
    { "format": "1:1", "imageBase64": "string" },
    { "format": "16:9", "imageBase64": "string" },
    { "format": "9:16", "imageBase64": "string" }
  ]
}
```

### POST `/api/generate-jingle`
Implements `prd.md > Asset Generation` (jingle)

**Request:**
```json
{
  "mood": "string (user-selected: upbeat, chill, dramatic, bold)",
  "jingleMood": "string (from proposal — genre, energy, tempo)",
  "brandName": "string",
  "industry": "string",
  "tagline": "string"
}
```

**What it does:**
- Calls Lyria 3 Clip (`lyria-3-clip`) for original music generation
- Sets mood-based BPM (upbeat=128, chill=80, dramatic=90, bold=110)
- Prompt includes brand context, industry, and mood direction
- Converts raw PCM to WAV with manual header construction (no external `wav` library)
- Returns WAV audio as base64

**Response:**
```json
{
  "audioBase64": "string (base64 WAV)",
  "duration": 30
}
```

**Timeout note:** Lyria generates a ~30s clip. Should complete within Vercel's 60s serverless limit.

### POST `/api/generate-video`
Implements `prd.md > Asset Generation` (video)

**Request:**
```json
{
  "videoScene": "string (from proposal)",
  "styleLock": { "colors": ["#hex", ...], "style": "string" },
  "logoBase64": "string (used as reference image)",
  "aspectRatio": "16:9"
}
```

**What it does:**
- Calls `ai.models.generateVideos()` with Veo (`veo-3.1-generate-preview`)
- Passes the logo as a reference image for style consistency
- Returns the operation ID immediately (does NOT wait for completion)

**Response:**
```json
{
  "operationId": "string"
}
```

### GET `/api/check-video?operationId=xxx`
**What it does:**
- Polls the Veo operation using `ai.operations.getVideosOperation()`
- If done: downloads the MP4 and returns it as base64
- If not done: returns status

**Response (in progress):**
```json
{
  "done": false,
  "status": "processing"
}
```

**Response (complete):**
```json
{
  "done": true,
  "videoBase64": "string (base64 MP4)"
}
```

### POST `/api/generate-voiceover`
Implements `prd.md > Asset Generation` (voiceover)

**Request:**
```json
{
  "script": "string (voiceover text from proposal)",
  "voiceTone": "string (warm, bold, energetic, etc.)"
}
```

**What it does:**
- Calls Gemini TTS (`gemini-2.5-flash-preview-tts`) with `responseModalities: ['AUDIO']`
- Configures voice via `speechConfig` with a prebuilt voice matching the requested tone
- Voice mapping: warm → "Kore", bold → "Charon", energetic → "Puck", calm → "Zephyr"
- Returns base64 PCM audio, converted to WAV

**Response:**
```json
{
  "audioBase64": "string (base64 WAV)",
  "voice": "string (voice name used)"
}
```

## Client-Side Libraries

### Style Lock (`lib/style-lock.ts`)
Implements the Style Lock feature from `prd.md > Logo Rating & Improvement`

- Takes an approved logo (base64 PNG)
- Draws it onto a hidden HTML `<canvas>`
- Uses `getImageData()` to extract pixel colors
- Runs a simple color quantization (find top 3-5 dominant colors)
- Returns a `StyleLock` object: `{ colors: string[], style: string }`
- The `style` string is generated by calling Gemini Vision to describe the logo's visual style in a few words (e.g., "minimalist, geometric, warm tones")

### FFmpeg Merge (`lib/ffmpeg.ts`)
Implements video + voiceover merge from `prd.md > Asset Generation`

- Loads `@ffmpeg/ffmpeg` WASM on app init (preload during onboarding steps)
- `mergeVideoAudio(videoBase64, audioBase64)` → returns merged MP4 as base64
- FFmpeg command: take video MP4, add audio WAV as audio track, output MP4

### Campaign Store (`lib/store.ts`)
IndexedDB persistence using `idb` library.

**Schema:**
```typescript
interface Campaign {
  id: string;
  createdAt: Date;

  // Inputs
  hasLogo: boolean;
  userLogo: string | null;        // base64 PNG
  competitorLogos: string[];       // base64 PNGs
  location: string;
  industry: string;
  brandName: string;

  // Logo phase
  approvedLogo: string;            // base64 PNG
  logoRating: LogoRating;
  styleLock: StyleLock;

  // Proposal phase
  proposal: CampaignProposal;
  jingleMood: string;              // user-selected mood

  // Generated assets
  banners: Banner[];               // { format, imageBase64 }
  jingle: string;                  // base64 WAV
  video: string;                   // base64 MP4 (raw from Veo)
  voiceover: string;               // base64 WAV
  finalVideo: string;              // base64 MP4 (merged video+voiceover)

  // State
  currentStep: 'onboarding' | 'rating' | 'proposal' | 'generating' | 'dashboard';
}
```

### Prompt Templates (`lib/prompts.ts`)
All LLM prompt strings in one file. Includes:
- `ANALYZE_LOGO_PROMPT` — logo rating with competitor comparison
- `GENERATE_LOGO_PROMPT` — logo creation from brand context
- `IMPROVE_LOGO_PROMPT` — apply specific improvement to existing logo
- `GENERATE_PROPOSAL_PROMPT` — creative brief generation
- `DESCRIBE_STYLE_PROMPT` — describe a logo's visual style for Style Lock
- `BANNER_PROMPT` — banner generation with Style Lock
- `VIDEO_SCENE_PROMPT` — Veo scene description enrichment
- `VOICEOVER_PROMPT` — TTS script with tone direction

Each prompt template accepts variables (brand name, industry, colors, etc.) and returns a formatted string.

## File Structure

```
marketeer/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout, fonts (Geist + Dirtyline), GlobalBackground
│   │   ├── page.tsx                      # Landing: DomeGallery + "I have a logo" / "Make me one"
│   │   ├── globals.css                   # Global styles
│   │   ├── onboarding/
│   │   │   ├── page.tsx                  # 4-step puzzle onboarding (all steps in one page)
│   │   │   ├── brand-name/page.tsx       # (unused) Brand name input
│   │   │   └── describe/page.tsx         # (unused) Brand description input
│   │   ├── rating/
│   │   │   └── page.tsx                  # Logo rating + improvements
│   │   ├── proposal/
│   │   │   └── page.tsx                  # Creative brief review + inline generation
│   │   ├── generating/
│   │   │   └── page.tsx                  # (orphaned) Staged generation animations
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Campaign dashboard + download
│   │   ├── history/
│   │   │   └── page.tsx                  # Past campaigns list (IndexedDB)
│   │   ├── dev/
│   │   │   └── page.tsx                  # Dev helper for seeding mock data
│   │   └── api/
│   │       ├── analyze-logo/route.ts     # Gemini Vision: rate logo
│   │       ├── generate-logo/route.ts    # Nano Banana: create logo
│   │       ├── improve-logo/route.ts     # Nano Banana: improve logo
│   │       ├── generate-proposal/route.ts # LLM: creative brief
│   │       ├── generate-banners/route.ts  # Nano Banana: 3 formats
│   │       ├── generate-jingle/route.ts   # Lyria: music generation → WAV
│   │       ├── generate-video/route.ts    # Veo: start async job
│   │       ├── check-video/route.ts       # Veo: poll completion
│   │       └── generate-voiceover/route.ts # TTS: voiceover WAV
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives (button, card, input)
│   │   ├── GlobalBackground.tsx          # LiquidEther on all pages except landing + mobile
│   │   ├── LiquidEther.tsx               # WebGL fluid simulation component
│   │   ├── StepWizard.tsx                # Layout wrapper with fade-in animation
│   │   ├── FileUpload.tsx                # Drag-drop image upload (single/multi mode)
│   │   ├── RatingCard.tsx                # Logo rating display
│   │   ├── ProposalCard.tsx              # Creative brief sections
│   │   ├── AssetCard.tsx                 # Dashboard asset card
│   │   ├── AudioPlayer.tsx               # Jingle/voiceover playback
│   │   ├── VideoPlayer.tsx               # Video ad playback
│   │   ├── hero/
│   │   │   ├── DomeGallery.tsx           # WebGL dome of storefront photos (Three.js)
│   │   │   └── DomeGallery.css
│   │   ├── LogoLoop/
│   │   │   ├── LogoLoop.tsx              # Horizontal scrolling logo carousel
│   │   │   └── LogoLoop.css
│   │   └── onboarding/
│   │       ├── PuzzleBlock.tsx           # Shared card layout for puzzle grid
│   │       └── sections/
│   │           ├── LogoSection.tsx        # Logo upload step
│   │           ├── CompetitorSection.tsx  # Competitor upload step
│   │           ├── LocationSection.tsx    # Location input step
│   │           └── IndustrySection.tsx    # Industry selector step
│   ├── lib/
│   │   ├── gemini.ts                     # GenAI SDK client setup
│   │   ├── style-lock.ts                 # Color extraction from logo
│   │   ├── prompts.ts                    # All LLM prompt templates
│   │   ├── ffmpeg.ts                     # WASM video+audio merge
│   │   ├── store.ts                      # IndexedDB campaign state
│   │   ├── motion.ts                     # Framer Motion animation variants
│   │   └── utils.ts                      # cn() helper (clsx + tailwind-merge)
│   ├── types/
│   │   └── campaign.ts                   # TypeScript interfaces
│   └── global.d.ts                       # TypeScript global declarations
├── public/
│   ├── fonts/
│   │   └── Dirtyline.woff2              # Display font
│   ├── ffmpeg/
│   │   ├── ffmpeg-core.js               # FFmpeg WASM core
│   │   ├── ffmpeg-core.wasm             # FFmpeg WASM binary (~25MB)
│   │   └── ffmpeg-worker.js             # FFmpeg WASM worker
│   ├── logos/
│   │   ├── glitchlogo.png               # Glitch Club logo
│   │   ├── geminilogo.png               # Gemini logo
│   │   └── uclalogo.png                 # UCLA logo
│   ├── marketeer-logo.svg               # App logo (light)
│   ├── marketeer-logo-dark.svg          # App logo (dark)
│   ├── marketeer-icon.svg               # App icon
│   └── marketeer-avatar.svg             # App avatar
├── docs/
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md
│   └── checklist.md
├── process-notes.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── .env                                  # GEMINI_API_KEY
```

## Team Split

### Person 1: Onboarding + UI Shell
**Files owned:**
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/onboarding/page.tsx`
- `app/history/page.tsx`
- `components/GlobalBackground.tsx`, `components/LiquidEther.tsx`
- `components/StepWizard.tsx`, `components/FileUpload.tsx`
- `components/hero/DomeGallery.tsx` + CSS
- `components/LogoLoop/LogoLoop.tsx` + CSS
- `components/onboarding/*` (PuzzleBlock + all section components)
- `lib/motion.ts`, `lib/utils.ts`
- Initial project setup (`package.json`, `next.config.ts`, `postcss.config.mjs`)

**Worktree:** `claude --worktree onboarding-ui`

### Person 2: Logo Analysis + Rating Engine
**Files owned:**
- `app/rating/page.tsx`
- `app/api/analyze-logo/route.ts`
- `app/api/generate-logo/route.ts`
- `app/api/improve-logo/route.ts`
- `lib/gemini.ts` (shared — set up first, others import)
- `lib/style-lock.ts`
- `components/RatingCard.tsx`
- `types/campaign.ts` (shared — set up first)

**Worktree:** `claude --worktree logo-rating`

### Person 3: Campaign Proposal + Asset Generation
**Files owned:**
- `app/proposal/page.tsx`
- `app/generating/page.tsx`
- `app/api/generate-proposal/route.ts`
- `app/api/generate-banners/route.ts`
- `app/api/generate-jingle/route.ts`
- `app/api/generate-video/route.ts`
- `app/api/check-video/route.ts`
- `app/api/generate-voiceover/route.ts`
- `lib/prompts.ts`
- `components/ProposalCard.tsx`

**Worktree:** `claude --worktree generation-pipeline`

### Person 4: Campaign Dashboard + Export
**Files owned:**
- `app/dashboard/page.tsx`
- `lib/ffmpeg.ts`
- `lib/store.ts`
- `components/AssetCard.tsx`
- `components/AudioPlayer.tsx`
- `components/VideoPlayer.tsx`

**Worktree:** `claude --worktree dashboard-export`

### Integration Order
1. **Person 1 + Person 2 start together** — Person 1 sets up the project scaffold, Person 2 sets up `lib/gemini.ts` and `types/campaign.ts` that everyone imports
2. **All 4 work in parallel** on their own worktrees
3. **Merge order:** Person 1 (shell) → Person 2 (rating) → Person 3 (generation) → Person 4 (dashboard)
4. **Integration session** — team merges branches and tests the full flow end-to-end

## Demo Flow

The 2-5 minute Devpost demo video should show:

1. **Open Marketeer** — landing page with DomeGallery storefront dome + LiquidEther background (3 seconds)
2. **"I have a logo" path** — puzzle onboarding: upload logo, upload competitor, enter location, pick industry, review grid (25 seconds)
3. **Logo rating appears** — show the score, the reasoning, the competitor comparison (20 seconds)
4. **Apply an improvement** — Nano Banana enhances the logo, score goes up (15 seconds)
5. **Campaign proposal** — show the creative brief with tagline, scene description, voiceover script (15 seconds)
6. **Hit "Generate"** — progress tracker steps through each model inline on proposal page (10 seconds)
7. **Dashboard** — walk through each asset: banners in 3 formats, play the jingle, play the video ad with voiceover (30 seconds)
8. **Download All** — click the button, show the zip (5 seconds)
9. **Quick recap** — mention 4 GenMedia models used, the Style Lock feature, and future plans (15 seconds)

Total: ~2.5 minutes. Fast, punchy, shows every feature.

## Key Technical Decisions

### 1. Client-side FFmpeg WASM over server-side FFmpeg
**Decision:** Video+voiceover merge happens in the browser using @ffmpeg/ffmpeg WASM.
**Why:** Avoids FFmpeg binary dependency on Vercel serverless. For a 4-8 second 720p clip, WASM performance is fine.
**Tradeoff:** 25MB WASM download on first load. Mitigated by preloading during onboarding steps.

### 2. IndexedDB over no persistence
**Decision:** Campaign data persists in the browser via IndexedDB.
**Why:** If the user refreshes mid-generation or wants to come back, their work is saved. Also makes the app feel more like a real product in the demo.
**Tradeoff:** Slightly more complexity than pure in-memory state.

### 3. Lyria buffered in API route
**Decision:** The `/api/generate-jingle` route calls Lyria, collects audio, then returns the complete WAV.
**Why:** Keeps the frontend simple — it just makes one fetch call and gets audio back. The generation complexity is contained in one API route.
**Tradeoff:** Route stays alive for ~30 seconds while Lyria generates. Must complete within Vercel's 60s timeout.

### 4. Style Lock via canvas color extraction + Gemini Vision
**Decision:** Extract dominant colors client-side (canvas API), describe style via Gemini Vision.
**Why:** Canvas color extraction is fast and free (no API call). Gemini Vision adds semantic understanding ("minimalist, geometric") that raw color data can't provide.
**Tradeoff:** Two-step process, but the Vision call is cheap and fast.

## Error Strategy

### API failures
- If any GenMedia API call fails, show a friendly error with a "Retry" button
- Don't block the entire pipeline — if banners succeed but jingle fails, show the banners and let the user retry just the jingle

### Veo timeout
- Frontend polls `/api/check-video` every 5 seconds
- If no response after 2 minutes, show "Video generation is taking longer than expected" with option to keep waiting or skip

### Lyria WebSocket failure
- If WebSocket connection fails or times out, fall back to a simple error message with retry
- Jingle is non-blocking — the rest of the campaign can exist without it

### Empty/first-run states
- Landing page needs no empty state — it's always the "Do you have a logo?" prompt
- Dashboard shows a "No campaign yet" message if accessed directly without completing the flow

## Dependencies & External Services

| Dependency | Purpose | Docs |
|-----------|---------|------|
| @google/genai | All GenMedia API calls | [npm](https://www.npmjs.com/package/@google/genai) |
| @ffmpeg/ffmpeg + @ffmpeg/core + @ffmpeg/util | Client-side video+audio merge (WASM) | [npm](https://www.npmjs.com/package/@ffmpeg/ffmpeg) |
| idb | IndexedDB wrapper | [npm](https://www.npmjs.com/package/idb) |
| jszip | Bundle assets for download | [npm](https://www.npmjs.com/package/jszip) |
| framer-motion | Layout animations + page transitions | [npm](https://www.npmjs.com/package/framer-motion) |
| three | WebGL rendering for DomeGallery | [npm](https://www.npmjs.com/package/three) |
| lucide-react | SVG icon components | [npm](https://www.npmjs.com/package/lucide-react) |
| @base-ui/react | Base UI primitives | [npm](https://www.npmjs.com/package/@base-ui/react) |

**API key needed:** `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey)

**Rate limits:** Google AI Studio free tier has per-minute limits that vary by model. For a hackathon demo, this should be fine. If rate-limited during build/testing, add a small delay between calls.

## Open Issues

1. **Lyria API version stability** — Lyria uses an experimental API. May change or have unexpected behavior. Fallback plan: if Lyria is unreliable, generate a simple jingle description and link to a royalty-free music tool as a "future feature."

2. **Veo reference image support** — Veo 3.1 supports up to 3 reference images for style consistency. Need to verify whether passing the logo as a reference image actually influences the output meaningfully. If not, rely on text prompt alone for style direction.

3. **Base64 payload sizes** — Generated images and video are passed as base64 strings. A 1K PNG is ~200KB base64, a 720p 8-second MP4 could be several MB. IndexedDB can handle this, but watch for memory pressure if many assets are stored simultaneously.

4. **Orphaned generating page** — `app/generating/page.tsx` is not reachable from any other page. Generation was moved inline to the Proposal page. The generating page could be removed or repurposed.

5. **Unused onboarding pages** — `app/onboarding/brand-name/page.tsx` and `app/onboarding/describe/page.tsx` exist but aren't part of the flow. Could be removed or integrated as future steps.
