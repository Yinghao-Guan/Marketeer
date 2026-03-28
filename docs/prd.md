# Marketeer — Product Requirements

## Problem Statement
People who need marketing materials — small business owners, entrepreneurs, creators running campaigns — either pay expensive agencies or spend hours fumbling through multiple disconnected tools (one for logos, another for banners, another for music). There's no single tool that takes a brand description and produces a full, cohesive, multi-format marketing campaign where every asset looks and feels like it belongs together.

## User Stories

### Epic: Onboarding & Brand Input

- As a new user, I want to tell the app whether I already have a logo so that I get the right flow for my situation.
  - [ ] First screen shows a clear "Do you have a logo?" prompt with Yes/No options
  - [ ] Selecting "Yes" takes me to the logo upload flow
  - [ ] Selecting "No" takes me to the logo generation flow

- As a user with a logo, I want to upload my existing logo so the app can work with it.
  - [ ] I can upload an image file of my logo
  - [ ] The uploaded logo displays back to me so I can confirm it's correct
  - [ ] After uploading, I'm prompted to upload competitor logos

- As a user without a logo, I want to provide my business details so the app can create a logo for me.
  - [ ] After selecting "No," I'm asked for my business location
  - [ ] Then I'm asked to select my industry from a list of categories
  - [ ] Then I'm prompted to upload competitor logos
  - [ ] The app generates a logo based on my industry, location, and competitor analysis

- As any user, I want to upload my competitors' logos/marketing material so the app can make my brand visually distinct.
  - [ ] I can upload one or more images of competitor logos, flyers, or storefront photos
  - [ ] The app analyzes competitor colors, style, and visual identity
  - [ ] This analysis feeds into all generated assets to ensure differentiation

- As a user with a logo, I want to enter my business location so the app has geographic context.
  - [ ] A screen asks for my business location (city/region)
  - [ ] Location is used to inform the tone and style of the campaign

- As a user with a logo, I want to select my industry so the app understands my market.
  - [ ] A screen shows industry categories I can pick from (restaurant, retail, tech, political campaign, etc.)
  - [ ] Industry selection influences the style, language, and scene choices in generated assets

### Epic: Logo Rating & Improvement

- As a user who uploaded a logo, I want the app to rate my logo's marketing effectiveness so I know if it needs improvement.
  - [ ] After all inputs are gathered, the app displays a rating for my logo
  - [ ] The rating evaluates how well the logo will work across marketing formats (banners, video, print)
  - [ ] The rating includes specific reasoning (e.g., "colors don't pop at small sizes," "too similar to competitor X's palette")
  - [ ] If the logo rates low on a specific format, the reasoning explains why

- As a user with a low-rated logo, I want the app to suggest specific improvements so I can strengthen my brand.
  - [ ] The app suggests actionable changes (different colors, higher contrast, simpler design, etc.)
  - [ ] Each suggestion explains the marketing reason behind it (e.g., "brighter colors perform better in online banner ads")
  - [ ] The app offers to apply the improvements automatically using Nano Banana
  - [ ] After improvements, the logo is re-rated to show the difference

- As a user who had a logo generated, I want to approve or regenerate it before moving on.
  - [ ] The generated logo displays with its rating
  - [ ] I can approve it or request a new generation
  - [ ] Once approved, the logo is locked in for the rest of the campaign

### Epic: Campaign Proposal

- As a user with an approved logo, I want to see a campaign proposal before anything is generated so I can steer the direction.
  - [ ] The proposal shows on one screen as a creative brief with:
    - Tagline in prominent text
    - Color palette swatches from the Style Lock
    - Banner concept (one sentence describing what the posters will look like)
    - Jingle mood and genre description
    - Video scene description (camera angles, setting, action)
    - Voiceover script (the actual words TTS will say)
  - [ ] I can approve the entire proposal to trigger generation
  - [ ] I can request changes — the LLM revises and presents an updated proposal
  - [ ] No API calls for heavy generation (images, music, video) happen until I approve

- As a user reviewing the proposal, I want the tagline to feel unique to my brand so it's memorable.
  - [ ] The tagline is generated based on brand name, industry, location, and mood
  - [ ] It's short and punchy (under 10 words)
  - [ ] If I don't like it, I can ask for alternatives without re-doing the whole proposal

### Epic: Asset Generation

- As a user who approved the proposal, I want banners/posters generated in multiple formats so I have assets ready for different platforms.
  - [ ] The app generates three banner formats automatically:
    - 1:1 square (Instagram, Facebook)
    - 16:9 landscape (website header, YouTube)
    - 9:16 portrait (Instagram Stories, TikTok)
  - [ ] All banners use the Style Lock colors and visual identity from the approved logo
  - [ ] Banners are generated at 1K resolution to conserve API tokens
  - [ ] Banners visually differentiate from uploaded competitor material

- As a user, I want a jingle created for my brand so I have audio branding.
  - [ ] Before generation, I pick a mood (upbeat, chill, dramatic, bold, etc.)
  - [ ] Lyria generates a 30-second jingle based on the brand info, industry, and selected mood
  - [ ] Lyria writes original lyrics inspired by the brand — not forced to use the tagline verbatim
  - [ ] The jingle plays back in an audio player for me to preview

- As a user, I want a video ad created for my brand so I have a promo clip.
  - [ ] Veo generates a unique scene based on the brand's industry, location, and vibe — not a cookie-cutter template
  - [ ] The scene description is crafted by the LLM (e.g., tracking shot through a restaurant, aerial of a neighborhood for a political campaign)
  - [ ] The video uses the approved logo and Style Lock colors as reference images for visual consistency
  - [ ] Video is generated at 720p, 4-8 seconds long

- As a user, I want a voiceover added to my video ad so it feels professional.
  - [ ] TTS reads the voiceover script from the approved proposal
  - [ ] The voice tone matches the brand energy (e.g., warm for a restaurant, bold for a sports brand)

### Epic: Loading & Progress

- As a user waiting for assets to generate, I want to see meaningful progress so I know the app isn't broken.
  - [ ] A progress indicator shows which asset is currently being generated
  - [ ] Progress messages name the step: "Crafting your banners..." → "Composing your jingle..." → "Filming your ad..." → "Recording your voiceover..."
  - [ ] The screen feels intentional and polished, not a generic spinner

### Epic: Campaign Dashboard

- As a user whose campaign is complete, I want to see all my assets on one dashboard so I can review everything together.
  - [ ] The dashboard displays:
    - Logo at the top
    - All banner formats in a gallery view
    - Audio player for the jingle
    - Video player for the ad (with voiceover)
    - Tagline and voiceover script as text
  - [ ] I can click into each asset to see it full-size or full-screen

- As a user reviewing my dashboard, I want to regenerate individual assets without redoing the whole campaign.
  - [ ] Each asset has a "Regenerate" button
  - [ ] Regenerating one asset doesn't affect the others
  - [ ] The regenerated asset still respects the Style Lock and brand context

- As a user, I want to download all my campaign assets so I can use them outside the app.
  - [ ] A "Download All" button bundles every asset (logo, banners, jingle audio, video, voiceover script) into a single download
  - [ ] I can also download individual assets one at a time

## What We're Building

The complete user journey described above:
1. **Onboarding flow** — two paths (has logo / no logo), location, industry, competitor upload
2. **Logo rating system** — Gemini Vision analyzes logo effectiveness across formats, provides reasoning and improvement suggestions, can auto-improve via Nano Banana
3. **Style Lock** — extracts color palette and visual style from approved logo, injects into all subsequent generation prompts
4. **Campaign proposal screen** — LLM-generated creative brief showing tagline, color palette, banner/jingle/video/voiceover plans. User approves or revises before generation starts
5. **Multi-format banner generation** — three aspect ratios (1:1, 16:9, 9:16) at 1K resolution via Nano Banana
6. **Jingle generation** — user picks mood, Lyria 3 Clip generates a 30-second branded jingle with original lyrics
7. **Video ad generation** — Veo creates a unique, industry-specific scene using the brand's reference images and Style Lock
8. **Voiceover** — TTS narrates the approved script over the video
9. **Progress indicators** — named loading states for each generation step
10. **Campaign dashboard** — all assets displayed together, per-asset regeneration, individual and bulk download

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

## Open Questions

- **App name** — "CampaignForge" is a placeholder. Team should pick a name they're excited about. (Resolve before building the landing page.)
- **Industry category list** — how many categories and what are they? Need to define the exact list before building the selector. (Resolve before /spec.)
- **Veo model version** — Veo 2 and 3.0 are deprecated, Veo 3.1 is recommended. Need to confirm API access for the hackathon. (Resolve before /build.)
- **Jingle length** — 30-second clip (Lyria 3 Clip) is the plan, but if the team gets early access to Lyria 3 Pro, a full song could be a differentiator. (Can wait until build.)
- **Video + voiceover sync** — TTS and Veo generate separately. How do we combine the audio with the video? Need to figure out if this is a frontend merge or a backend stitch. (Resolve during /spec.)
