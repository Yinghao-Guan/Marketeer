# Build Checklist — Person 1: Onboarding + UI Shell

## Build Preferences

- **Git:** No enforced commit cadence — commit whenever it feels right
- **Verification:** Run dev server and visually confirm after each step
- **Check-in cadence:** Balanced — explain the "why" behind key decisions, but keep moving

## Checklist

- [x] **1. Project scaffold and dependency installation**
  Spec ref: `spec.md > Stack` + `spec.md > File Structure`
  What to build: Initialize the Next.js project with App Router and TypeScript (if not already done). Install all dependencies: Tailwind CSS, shadcn/ui, framer-motion, reactbits, idb, jszip, @ffmpeg/ffmpeg. Configure `tailwind.config.ts` with the project's design tokens. Set up the `src/app/` directory structure and `src/components/ui/` folder. Initialize shadcn/ui so its component CLI works for the team.
  Acceptance: `npm run dev` starts without errors. Tailwind utility classes render correctly. shadcn/ui components can be added via CLI. The folder structure matches `spec.md > File Structure` for Person 1's owned files.
  Verify: Run `npm run dev`, open `localhost:3000`, and confirm the default Next.js page loads with Tailwind styles applied.

- [x] **2. Root layout and animated background**
  Spec ref: `spec.md > Frontend Pages > Landing Page` + `spec.md > File Structure > layout.tsx`
  What was built: `src/app/layout.tsx` as root layout with Geist + Dirtyline fonts, dark mode, and metadata. `src/components/GlobalBackground.tsx` renders a `LiquidEther` WebGL fluid simulation on all pages except the landing page and mobile (saves GPU). Landing page has its own LiquidEther instance + a `DomeGallery` (Three.js dome of storefront photos). Background is a purple/pink animated fluid behind all foreground content.
  Acceptance: Every page renders inside the root layout. The LiquidEther background is visible and smooth. The dark `#0a0a0a` aesthetic matches the bold design energy.
  Verify: Run dev server and confirm the fluid background renders. Navigate between routes and confirm it persists (except on landing page which has its own).

- [x] **3. Landing page — "Do you have a logo?"**
  Spec ref: `spec.md > Frontend Pages > Landing Page`
  What was built: `src/app/page.tsx` with split layout — DomeGallery (WebGL dome of storefront Unsplash photos, desktop only) on left ~70%, branding + CTA on right ~30%. "Marketeer" title in Dirtyline font with animated gradient. Subtitle, rotating business type ticker, and two CTA buttons: "I have a logo" (white, primary) and "Make me one" (outline, secondary). Both buttons go to `/onboarding` and store `hasLogo` in sessionStorage. "View past campaigns" link to `/history`. LogoLoop carousel at bottom showing hackathon partner logos (Glitch Club, Gemini, UCLA).
  Acceptance: Landing page shows "Marketeer" title, rotating business types, and both buttons. Both buttons route to `/onboarding`. DomeGallery renders on desktop.
  Verify: Run dev server, open `localhost:3000`. Confirm title, buttons, and DomeGallery render. Click "I have a logo" — confirm URL changes to `/onboarding`. Go back. Click "Make me one" — same destination.

- [x] **4. FileUpload component**
  Spec ref: `spec.md > File Structure > components/FileUpload.tsx`
  What was built: `src/components/FileUpload.tsx` — reusable drag-and-drop image upload component. Accepts image files, shows a visual drop zone with customizable label, displays preview thumbnails, and exposes image data as base64 data URLs via `onFilesChange` callback. Used by LogoSection (single file) and CompetitorSection (multi-file).
  Acceptance: Component renders a drop zone. Dragging an image shows a preview. Clicking opens file picker. Base64 data URLs are passed to parent via callback.
  Verify: Upload an image via drag-and-drop and via click on the onboarding page. Confirm previews display.

- [x] **5–8. Onboarding steps (consolidated into single puzzle page)**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow`
  What was built: Instead of 4 separate pages, all onboarding steps were consolidated into `src/app/onboarding/page.tsx` — a single-page puzzle UI. Each step is a section component (`LogoSection`, `CompetitorSection`, `LocationSection`, `IndustrySection`) rendered inside a `PuzzleBlock`. Steps use `useReducer` with a state machine (steps 0–4). Completed steps collapse into clickable chips using Framer Motion LayoutGroup. Step 4 shows a 2×2 review grid where users can click any card to re-edit. "Generate Campaign" button writes all data to sessionStorage and navigates to `/rating`.
  - **Step 0 — Logo**: `LogoSection` uses FileUpload in single-file mode. "Continue" advances.
  - **Step 1 — Rivals**: `CompetitorSection` uses FileUpload in multi-file mode. Gallery preview.
  - **Step 2 — Location**: `LocationSection` has a text input for city/region.
  - **Step 3 — Industry**: `IndustrySection` displays 10 selectable categories with "Other" text input.
  - **Step 4 — Review**: 2×2 card grid showing all inputs. Cards are clickable to re-edit.
  Acceptance: All 4 input steps work in sequence. Completed steps show as chips. Review grid displays all data. "Generate Campaign" navigates to `/rating`.
  Verify: Run dev server, navigate to `/onboarding`. Complete all 4 steps. Confirm puzzle transitions animate smoothly. Click a card in review grid — confirm it re-opens that step. Click "Generate Campaign" — confirm URL changes to `/rating`.
  Note: `app/onboarding/brand-name/page.tsx` and `app/onboarding/describe/page.tsx` also exist but are unused in the active flow.

- [x] **9. StepWizard, animations, and motion system**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow`
  What was built: `src/components/StepWizard.tsx` is a layout wrapper with fade-in animation used on onboarding and proposal pages. `src/lib/motion.ts` contains all shared Framer Motion variants: `fadeBlur` (fade + blur entrance), `staggerContainer`/`staggerChild` (staggered list reveals), `puzzleEnter`/`puzzleSpring` (puzzle block transitions), `titleLetter` (per-letter title animation), and `chipEnter` (chip pill animations). The onboarding puzzle uses LayoutGroup + AnimatePresence for smooth step-to-step transitions — steps don't navigate between pages, they animate within the single onboarding page.
  Acceptance: All page transitions are animated. Puzzle steps animate smoothly between active/completed/grid states. Landing page elements stagger in on load.
  Verify: Run dev server and click through the full flow. Confirm puzzle transitions animate. Confirm landing page elements fade/blur in sequentially.

- [ ] **10. Prepare and record Devpost demo video**
  Spec ref: `spec.md > Demo Flow` + `prd.md > What We're Building`
  What to build: Script a 2-5 minute demo walkthrough as a team. Person 1's section covers the first ~30 seconds: animated landing page (3 sec), "I have a logo" path with logo + competitor upload (15 sec), location + industry input (10 sec). The wow moments are the animated background making a strong first impression and the smooth onboarding transitions. Record with clear audio and visible UI. Reference [Devpost's demo video tips](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video).
  Acceptance: Video clearly shows the full app working end-to-end. Problem statement is stated upfront. Core user flow is demonstrated through all team members' sections. Audio is clear and narration is coherent.
  Verify: Watch the recording end to end. Would a judge who knows nothing about your project understand what it does and why it matters?
