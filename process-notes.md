# Process Notes

## /scope

### How the idea evolved
- Started with a memory-to-video concept: describe a memory, LLM refines the prompt, Veo generates a video recreating it. Initially considered Alzheimer's patients as the target user.
- Learner self-identified the ethical concern with Alzheimer's (patients could be confused/terrified by inaccurate AI recreations) — strong critical thinking.
- Pivoted to a passive weekly life recap app (photos + location → auto-generated video summary), inspired by Apple Photos Memories.
- After seeing that photo-to-video apps already exist (Photo Revive, Memories app), the learner decided to pivot again rather than compete in a crowded space.
- Landed on an AI marketing campaign generator — one prompt generates a full brand package across multiple GenMedia models. This clicked because it naturally uses 4 out of 5 required models.

### Pushback and responses
- Pushed the learner to define a specific user beyond "anybody" and "old people" — learner pushed back and wanted to keep it broad. Eventually resolved by focusing on the demo scenario rather than restricting the user base.
- Suggested cutting the local competitor survey feature — learner pushed back strongly, clearly felt it was important. Compromised: manual competitor input for the build, auto-detect as a future feature. **This was a strong moment of the learner steering the direction.**
- Learner also pushed back on questions they felt were unnecessary ("is this really important dude?", "blud wut") — kept the conversation moving rather than getting bogged down.

### References that resonated
- The Apple Photos Memories comparison clicked during the memory-to-video phase
- The "bakery vs. buying ingredients" analogy helped address the "can't you just do this in Gemini?" concern
- reactbits.dev for animated UI components — learner brought this reference themselves

### Technical experience summary
- Team of 4, all intermediate developers, all using Claude Code with unlimited usage
- Comfortable reading and working with code, have built things before
- Planning to use Next.js
- Claude Code is the primary implementation tool

### Active shaping
The learner drove several key decisions:
- Self-identified the Alzheimer's ethical concern before being prompted
- Initiated the pivot from memory-to-video to marketing campaign generator
- Insisted on the competitor differentiation feature despite pushback — this became a core feature with a feasible implementation (manual input)
- Chose Next.js and reactbits.dev for the tech stack and aesthetic
- Proposed the step-by-step approval flow (logo first, then cascade)
- Suggested the marketing plan as a stretch goal
- Pushed back on questions they felt were slowing things down, keeping the pace brisk

## /prd

### What the learner added or changed vs the scope doc
- Added the **logo rating system** — this wasn't in the scope at all. The learner proposed it as a way to evaluate how well a logo will perform across marketing formats, with specific reasoning and auto-improvement. This became a core feature.
- Added the **campaign proposal screen** — a creative brief the user reviews before any heavy generation happens. Saves tokens and gives the user a control point. Learner drove this by mapping out the full flow ("LLM gives proposal, if good → generate, if not → new proposal").
- Refined the video ad approach — learner pushed back against cookie-cutter templates, wanting each video to be a unique scene based on the brand's industry and vibe.
- Clarified the two-path onboarding flow (has logo vs. no logo) with specific steps for each.
- Added the dashboard as a core feature for viewing all generated assets.

### What "what if" questions surprised them
- The question about what happens if the user gets a low rating and just wants to proceed anyway helped clarify that the rating is diagnostic, not a gate.
- How many banner formats to generate — landed on three automatic formats (1:1, 16:9, 9:16) rather than making the user choose.

### What they pushed back on or felt strongly about
- Pushed back hard on cookie-cutter video ads — wanted every video to feel unique to the brand, not a template with a logo swap.
- Chose "light preferences" for jingle control (pick a mood, app handles the rest) rather than full customization or full automation.
- Chose Lyria writing original lyrics rather than forcing the tagline into the jingle.
- Insisted on 1K resolution instead of 4K to conserve tokens — practical and smart.

### Scope guard conversations
- The proposal screen adds a step but actually *saves* scope by preventing wasted API calls on assets the user doesn't want.
- No features were cut during PRD — the scope was already well-constrained from /scope.

### Active shaping
The learner was significantly more engaged in this phase:
- Proposed the rating system entirely on their own — a major feature addition.
- Mapped out the full app flow unprompted ("if logo good → proposal, if proposal good → generate").
- Made the call on 1K resolution to conserve tokens.
- Pushed back on cookie-cutter videos, driving the unique scene generation approach.
- Asked for suggestions when uncertain but made clear decisions on each one.
- Requested use of the AskUserQuestion tool when they wanted structured options — showing awareness of the tools available.

## /spec

### Technical decisions and rationale
- **Next.js for everything** — learner briefly considered FastAPI (Python backend) but ultimately chose to keep the original Next.js plan for simplicity. One framework, one deployment.
- **Vercel deployment** — natural fit with Next.js, one-click deploy.
- **Tailwind + shadcn/ui + React Bits + Framer Motion** — learner wanted "sexy" UI that's not cookie-cutter. This combo gives them solid structure (shadcn), utility styling (Tailwind), animated flair (React Bits), and smooth transitions (Framer Motion).
- **IndexedDB for persistence** — learner suggested local storage approach, landed on IndexedDB for browser-side campaign persistence.
- **FFmpeg WASM client-side** — for merging Veo video with TTS voiceover. Chose WASM over server-side to avoid Vercel deployment issues. Learner was concerned about demo quality impact — reassured that 4-8s 720p merge is trivial for WASM.
- **App renamed to Marketeer** — learner chose this name.

### What the learner was confident about vs uncertain
- **Confident:** Next.js as the framework, Vercel deployment, keeping the original team split, the app name "Marketeer"
- **Uncertain:** CSS/styling choices (said "whatever just as long as they look sexy"), FastAPI vs Next.js (briefly wavered then committed to Next.js), FFmpeg WASM quality concerns

### Self-review findings
- Lyria WebSocket in serverless function is risky but feasible within 60s timeout
- FFmpeg WASM should be client-side, not an API route — corrected in the spec
- Person 3 has the heaviest workload (proposal + all 4 generation endpoints) — suggested rebalancing but learner preferred to keep the original split

### Stack choices
- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, React Bits, Framer Motion, @google/genai SDK, @ffmpeg/ffmpeg WASM, IndexedDB (via idb), JSZip for downloads

### Active shaping
- Learner initiated the FastAPI consideration on their own, then made the call to stay with Next.js after hearing the tradeoffs
- Named the app "Marketeer" unprompted
- Pushed back on rebalancing the team split — wanted to keep original assignments
- Asked for suggestions on styling but set a clear bar ("look sexy, no basic hover animations")

## /checklist

### Sequencing decisions and rationale
- Scaffold first (everyone depends on it) → layout + animated background (the shell) → landing page (something visible fast) → FileUpload component (reused by 2 pages) → onboarding pages in user-flow order → transitions as a polish pass at the end
- FileUpload built before the pages that use it to avoid duplication and rework
- StepWizard/transitions saved for last because the pages need to exist before you can polish the transitions between them

### Methodology preferences
- No enforced git commit cadence — learner doesn't want workflow overhead baked in
- Balanced check-in cadence — explain the "why" but keep moving
- Verification via dev server visual confirmation after each step

### Item count and estimated build time
- 10 items total (9 build steps + demo video)
- Each step estimated at 15-30 minutes → ~3-4 hours total build time
- Scoped specifically to Person 1's ownership (onboarding + UI shell)

### What the learner was confident about vs needed guidance on
- Didn't engage with the sequencing question ("i dont really care") — accepted the proposed order without pushback
- Didn't want git cadence built into the checklist ("do not worry abt that")
- Quick, decisive on preferences — chose "balanced" for check-in cadence without deliberation
- Identified both the animated background AND smooth transitions as the demo wow moments — good instinct for demo impact

### Demo video planning notes
- Person 1's section covers the first ~30 seconds of the demo
- Two wow moments: animated background (first impression) and smooth onboarding transitions (polish feel)
- Demo video is a full-team effort after all branches merge
- Referenced Devpost demo video tips link for the team

### Active shaping
- The learner did NOT engage with sequencing logic — accepted the proposed order. This is consistent with their pattern of moving fast and not belaboring decisions they trust the agent to handle. They were more engaged in earlier phases (/scope, /prd) where the creative and product decisions lived.
