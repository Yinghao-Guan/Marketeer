# Marketeer — Product Requirements

## Problem Statement
People who need marketing materials — small business owners, entrepreneurs, creators running campaigns — either pay expensive agencies or spend hours fumbling through multiple disconnected tools (one for logos, another for banners, another for music). There's no single tool that takes a brand description and produces a full, cohesive, multi-format marketing campaign where every asset looks and feels like it belongs together.

## User Stories

### Epic: Onboarding & Brand Input

- As a new user, I want to tell the app whether I already have a logo so that I get the right flow for my situation.
  - [x] First screen shows "I have a logo" / "Make me one" buttons (landing page)
  - [x] Selecting "I have a logo" takes me to onboarding with logo upload as first step
  - [x] Selecting "Make me one" takes me to onboarding (logo is generated later at the rating page)

- As a user with a logo, I want to upload my existing logo so the app can work with it.
  - [x] I can upload an image file of my logo (LogoSection in onboarding puzzle)
  - [x] The uploaded logo displays back to me so I can confirm it's correct
  - [x] After uploading, I'm prompted to upload competitor logos (next puzzle step)

- As a user without a logo, I want to provide my business details so the app can create a logo for me.
  - [x] Both paths go through the same onboarding steps (logo upload is optional when hasLogo=false)
  - [x] I'm asked for my business location and industry
  - [x] I'm prompted to upload competitor logos
  - [x] The rating page generates a logo based on my industry, location, and competitor analysis

- As any user, I want to upload my competitors' logos/marketing material so the app can make my brand visually distinct.
  - [x] I can upload one or more images of competitor logos, flyers, or storefront photos (CompetitorSection)
  - [x] The app analyzes competitor colors, style, and visual identity (via /api/analyze-logo)
  - [x] This analysis feeds into all generated assets to ensure differentiation

- As a user with a logo, I want to enter my business location so the app has geographic context.
  - [x] A step asks for my business location (city/region) — LocationSection in onboarding
  - [x] Location is used to inform the tone and style of the campaign

- As a user with a logo, I want to select my industry so the app understands my market.
  - [x] A step shows 10 industry categories to pick from (IndustrySection)
  - [x] Industry selection influences the style, language, and scene choices in generated assets

### Epic: Logo Rating & Improvement

- As a user who uploaded a logo, I want the app to rate my logo's marketing effectiveness so I know if it needs improvement.
  - [x] After all inputs are gathered, the rating page displays a rating for my logo
  - [x] The rating evaluates how well the logo will work across marketing formats (banner, video, social)
  - [x] The rating includes specific reasoning for each format
  - [x] If the logo rates low on a specific format, the reasoning explains why

- As a user with a low-rated logo, I want the app to suggest specific improvements so I can strengthen my brand.
  - [x] The app suggests actionable changes with priority levels
  - [x] Each suggestion explains the marketing reason behind it
  - [x] The app offers to apply the improvements automatically using Nano Banana
  - [x] After improvements, the logo is re-rated to show the difference (logo history tracked)

- As a user who had a logo generated, I want to approve or regenerate it before moving on.
  - [x] The generated logo displays with its rating
  - [x] I can approve it and continue to the proposal
  - [x] Once approved, the logo is locked in for the rest of the campaign (Style Lock extracted)

### Epic: Campaign Proposal

- As a user with an approved logo, I want to see a campaign proposal before anything is generated so I can steer the direction.
  - [x] The proposal shows on one screen as a creative brief with:
    - Tagline in prominent text
    - Banner concept (one sentence describing what the posters will look like)
    - Jingle mood and genre description
    - Video scene description (camera angles, setting, action)
    - Voiceover script (the actual words TTS will say)
  - [x] I can approve the entire proposal to trigger generation
  - [x] I can request changes — the LLM revises and presents an updated proposal
  - [x] No API calls for heavy generation happen until I approve

- As a user reviewing the proposal, I want the tagline to feel unique to my brand so it's memorable.
  - [x] The tagline is generated based on brand name, industry, location, and style
  - [x] It's short and punchy
  - [x] I can revise the proposal to get a new tagline

### Epic: Asset Generation

- As a user who approved the proposal, I want banners/posters generated in multiple formats so I have assets ready for different platforms.
  - [x] The app generates three banner formats automatically:
    - 1:1 square (Instagram, Facebook)
    - 16:9 landscape (website header, YouTube)
    - 9:16 portrait (Instagram Stories, TikTok)
  - [x] All banners use the Style Lock colors and visual identity from the approved logo
  - [x] Banners are generated via Nano Banana (3 parallel calls)
  - [x] Banners visually differentiate from uploaded competitor material

- As a user, I want a jingle created for my brand so I have audio branding.
  - [x] Jingle mood is part of the campaign proposal
  - [x] Lyria 3 Clip generates music based on brand info, industry, and mood-based BPM
  - [x] The jingle plays back in an AudioPlayer component for preview

- As a user, I want a video ad created for my brand so I have a promo clip.
  - [x] Veo 3.1 generates a unique scene based on the brand's industry, location, and vibe
  - [x] The scene description is crafted by the LLM as part of the proposal
  - [x] The video uses the approved logo as a reference image for visual consistency
  - [x] Video generation is async (operation ID + polling via /api/check-video)

- As a user, I want a voiceover added to my video ad so it feels professional.
  - [x] TTS reads the voiceover script from the approved proposal
  - [x] Voice tone matches brand energy via voice mapping (warm→Kore, bold→Charon, energetic→Puck, calm→Zephyr)

### Epic: Loading & Progress

- As a user waiting for assets to generate, I want to see meaningful progress so I know the app isn't broken.
  - [x] Inline progress tracker on the proposal page shows which asset is currently generating
  - [x] Progress messages name the step: "Crafting your banners..." → "Composing your jingle..." → "Filming your ad..." → "Recording your voiceover..." → "Putting it all together..."
  - [x] Each step shows status (waiting/active/done/error)

### Epic: Campaign Dashboard

- As a user whose campaign is complete, I want to see all my assets on one dashboard so I can review everything together.
  - [x] The dashboard displays:
    - Logo at the top
    - All banner formats in a gallery view
    - AudioPlayer for the jingle
    - VideoPlayer for the ad (video + voiceover merged via FFmpeg WASM)
    - Tagline and voiceover script as text
  - [x] Dashboard loads campaign from IndexedDB (by ID or latest)

- As a user reviewing my dashboard, I want to regenerate individual assets without redoing the whole campaign.
  - [x] Each asset has a "Regenerate" button
  - [x] Regenerating one asset doesn't affect the others
  - [x] The regenerated asset still respects the Style Lock and brand context

- As a user, I want to download all my campaign assets so I can use them outside the app.
  - [x] A "Download All" button bundles assets into a zip (JSZip)
  - [x] Individual download buttons per asset

## What We're Building

The complete user journey described above:
1. **Landing page** — DomeGallery + LiquidEther background, "I have a logo" / "Make me one" CTA
2. **Onboarding flow** — single puzzle page with 4 steps (logo, competitors, location, industry), review grid, then "Generate Campaign"
3. **Logo rating system** — Gemini Vision analyzes logo effectiveness across formats, provides reasoning and improvement suggestions, can auto-improve via Nano Banana
4. **Style Lock** — extracts color palette and visual style from approved logo, injects into all subsequent generation prompts
5. **Campaign proposal screen** — LLM-generated creative brief showing tagline, banner/jingle/video/voiceover plans. User approves or revises before generation starts
6. **Inline asset generation** — generation happens on the proposal page with 5-step progress tracker (banners → jingle → video → voiceover → merge)
7. **Multi-format banner generation** — three aspect ratios (1:1, 16:9, 9:16) via Nano Banana
8. **Jingle generation** — Lyria 3 Clip generates music based on mood and brand context
9. **Video ad generation** — Veo 3.1 creates a unique, industry-specific scene using the brand's reference images
10. **Voiceover** — TTS narrates the approved script, merged with video via FFmpeg WASM
11. **Campaign dashboard** — all assets displayed together, per-asset regeneration, individual and bulk download (JSZip)
12. **Campaign history** — view and manage past campaigns saved in IndexedDB

**GenMedia models used:** Nano Banana (logos, banners), Lyria (jingle), Veo (video ad), TTS (voiceover) — 4 out of 5 required models.

## What We'd Add With More Time

- **Marketing plan generator** — after assets are created, the app recommends where and when to post each asset (Instagram Tuesday at 6pm, TikTok Thursday, etc.)
- **Brand Kit Input questionnaire** — a detailed onboarding that asks about target audience, brand personality, tone of voice before generation
- **Gemini Search Grounding for competitor lookup** — instead of uploading competitor photos, user just types competitor name and the app researches them automatically
- **Firecrawl API for competitor brand extraction** — paste a competitor's website URL and auto-extract their colors, fonts, and logo
- **Auto-detect local competitors** — use location to automatically find and analyze nearby competing businesses
- **Lyria 3 Pro full-length jingle** — upgrade from 30-second clip to a full 2-3 minute brand song
- **Multiple video clips stitched together** — generate a brand scene + a logo reveal and combine into one longer ad

## Non-Goals

- **User accounts or saved campaigns** — this is a single-session tool for the hackathon. No login, no persistence between sessions.
- **Mobile app** — web only via Next.js. Responsive design is nice-to-have but not required.
- **Real-time collaboration** — no multi-user editing or sharing during generation.
- **Auto-detect local competitors** — user uploads competitor material manually. Auto-detection is a future feature.
- **4K resolution assets** — 1K for images and 720p for video to conserve API tokens. Mention 4K as a premium feature in presentation.
- **Multiple campaign variations** — one campaign per session. No A/B testing or variant generation.

## Open Questions (Resolved)

- **App name** — Resolved: **Marketeer**
- **Industry category list** — Resolved: 10 categories (Restaurant / Food & Drink, Retail / Shopping, Tech / Software, Health & Wellness, Education, Real Estate, Political Campaign, Entertainment / Events, Professional Services, Other with text input)
- **Veo model version** — Resolved: Using `veo-3.1-generate-preview`
- **Jingle length** — Resolved: Using Lyria 3 Clip (`lyria-3-clip`) with mood-based BPM
- **Video + voiceover sync** — Resolved: Client-side merge using @ffmpeg/ffmpeg WASM. FFmpeg binaries served from `public/ffmpeg/`. COOP/COEP headers set in `next.config.ts` for SharedArrayBuffer support.
