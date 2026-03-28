# Marketeer

## Idea
An AI-powered marketing campaign generator that takes a single brand description and produces a full, cohesive campaign package — logo, posters, jingle, video ad with voiceover — using Google's GenMedia models in one guided flow.

## Who It's For
Small business owners, entrepreneurs, creators, or anyone who needs professional-looking marketing materials but doesn't have the budget or time to hire an agency. They have a product or brand in mind but no design skills or marketing expertise.

## Inspiration & References
- [Revid AI](https://www.revid.ai/tools/create-video-from-memories) — AI video creation from simple inputs
- [FlexClip](https://www.flexclip.com/create/recap-video.html) — template-based video/recap maker
- [reactbits.dev](https://reactbits.dev) — animated UI components for the frontend
- Existing tools like Canva and Looka handle individual pieces (logos, posters) but nothing orchestrates a full multi-model campaign from a single prompt with style consistency.

Design energy: Eye-catching, bold, animated backgrounds (reactbits.dev components), modern and visually impressive. The app itself should look like it has great taste — it's a marketing tool, so it needs to market *itself* well.

## Goals
- Build something that wins a prize at the hackathon
- Hit as many GenMedia models as possible (4 out of 5: Nano Banana, Lyria, Veo, TTS)
- Create a smooth, guided user experience that feels polished in a demo
- Show that the multi-model orchestration adds real value over using Gemini manually

## What "Done" Looks Like
A Next.js web app where the user:
1. Describes their brand/product and names their competitors
2. Gets a generated logo (Nano Banana) — approves or requests changes
3. Style Lock kicks in: color palette and visual style extracted from the approved logo
4. Gets posters/banners generated in the locked style (Nano Banana)
5. Gets a jingle/audio branding created (Lyria)
6. Gets a short video ad generated (Veo) with voiceover (TTS)
7. Downloads all assets as a campaign package

Each step requires user approval before proceeding. The user can optionally upload competitor marketing material (logo, flyer, photo of storefront) and Gemini Vision analyzes it to ensure the generated campaign is visually distinct.

## What's Explicitly Cut
- **Auto-detect local competitors** — too complex for the build. Mentioned as "next steps" in presentation.
- **Gemini Search Grounding / Firecrawl for competitor lookup** — next steps. For now, user uploads a photo manually instead.
- **Brand Kit Input questionnaire** — stretch goal if time allows. For now, a single description prompt plus competitor names is enough.
- **Marketing plan generator** (where/when to post) — stretch goal if time allows.
- **User accounts / saving campaigns** — not needed for a hackathon demo.
- **Mobile app** — web only via Next.js.
- **Real-time collaboration** — each team member builds their assigned piece, not a multi-user feature.

## Technical Experience
- Team of 4, all using Claude Code with unlimited usage
- Skill level: intermediate — can read and work with code, have built things before, but not shipping production apps daily
- Planning to use Next.js (familiar enough to build with)
- Claude Code is the primary coding tool for all team members

## Loose Implementation Notes
- **Framework:** Next.js (React frontend + API routes for backend calls)
- **UI:** Eye-catching design with animated backgrounds from reactbits.dev
- **GenMedia models used:**
  - Nano Banana (image generation) → logos, posters, banners
  - Lyria (music generation) → jingle / audio branding
  - Veo (video generation) → short video ad
  - TTS (text-to-speech) → voiceover for the video ad
- **Style Lock:** After logo approval, extract dominant colors and style descriptors, inject them into all subsequent prompts to maintain visual coherence
- **Competitor differentiation:** User uploads a photo/screenshot of competitor's logo, flyer, or storefront → Gemini Vision analyzes their colors, style, and vibe → app avoids those colors and styles in generated assets. Future versions could use Gemini Search Grounding or Firecrawl Branding API for automatic competitor lookup.
- **Asset download:** Bundle all generated assets for download at the end
- **Stretch goals (in priority order):**
  1. Marketing plan feature (posting schedule and platform recommendations)
  2. Brand Kit Input (detailed questionnaire before generation)
