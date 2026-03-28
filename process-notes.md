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
