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
1. Lands on a visually striking page with "I have a logo" / "Make me one" CTA
2. Completes a 4-step puzzle onboarding (logo upload, competitor upload, location, industry)
3. Gets their logo rated by Gemini Vision — can approve or apply AI improvements
4. Style Lock kicks in: color palette and visual style extracted from the approved logo
5. Reviews a campaign proposal (tagline, banner concept, jingle mood, video scene, voiceover script) — can revise
6. Approves to trigger inline generation: banners (Nano Banana ×3), jingle (Lyria), video (Veo), voiceover (TTS), merge (FFmpeg WASM)
7. Views all assets on a dashboard, regenerates individual assets, downloads as zip
8. Can revisit past campaigns from the history page

Each step requires user approval before proceeding. The user uploads competitor marketing material (logo, flyer, photo of storefront) and Gemini Vision analyzes it to ensure the generated campaign is visually distinct.

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
- **Framework:** Next.js 16 (React frontend + API routes for backend calls, Turbopack, React Compiler)
- **UI:** Eye-catching dark design with LiquidEther fluid backgrounds (WebGL), DomeGallery storefront photo dome (Three.js), Framer Motion animations
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
