# Build Checklist — Person 1: Onboarding + UI Shell

## Build Preferences

- **Git:** No enforced commit cadence — commit whenever it feels right
- **Verification:** Run dev server and visually confirm after each step
- **Check-in cadence:** Balanced — explain the "why" behind key decisions, but keep moving

## Checklist

- [ ] **1. Project scaffold and dependency installation**
  Spec ref: `spec.md > Stack` + `spec.md > File Structure`
  What to build: Initialize the Next.js project with App Router and TypeScript (if not already done). Install all dependencies: Tailwind CSS, shadcn/ui, framer-motion, reactbits, idb, jszip, @ffmpeg/ffmpeg. Configure `tailwind.config.ts` with the project's design tokens. Set up the `src/app/` directory structure and `src/components/ui/` folder. Initialize shadcn/ui so its component CLI works for the team.
  Acceptance: `npm run dev` starts without errors. Tailwind utility classes render correctly. shadcn/ui components can be added via CLI. The folder structure matches `spec.md > File Structure` for Person 1's owned files.
  Verify: Run `npm run dev`, open `localhost:3000`, and confirm the default Next.js page loads with Tailwind styles applied.

- [ ] **2. Root layout and animated background**
  Spec ref: `spec.md > Frontend Pages > Landing Page` + `spec.md > File Structure > layout.tsx`
  What to build: Build `src/app/layout.tsx` as the root layout with global styles, fonts, and metadata. Create `src/components/AnimatedBackground.tsx` using a React Bits animated background component (e.g., Hyperspeed, Threads, or similar from reactbits.dev). The background should render behind all pages and look visually striking — this is the first thing judges see in the demo.
  Acceptance: Every page in the app renders inside the root layout. The animated background is visible, smooth, and doesn't interfere with foreground content. The app has a dark, modern aesthetic that matches the "bold, eye-catching" design energy from scope.md.
  Verify: Run dev server and confirm the animated background renders on the default page. Navigate between routes (even if they're empty) and confirm the background persists across pages.

- [ ] **3. Landing page — "Do you have a logo?"**
  Spec ref: `spec.md > Frontend Pages > Landing Page`
  What to build: Build `src/app/page.tsx` with the app name "Marketeer" displayed prominently and a single prompt: "Do you have a logo?" with Yes and No buttons. Use shadcn/ui Button components styled to stand out against the animated background. Yes navigates to `/onboarding/upload-logo`. No navigates to `/onboarding/location` (skipping the logo upload step).
  Acceptance: Landing page shows "Marketeer" title and "Do you have a logo?" prompt. Yes button routes to `/onboarding/upload-logo`. No button routes to `/onboarding/location`. The page looks polished against the animated background.
  Verify: Run dev server, open `localhost:3000`. Confirm the title and buttons render. Click Yes — confirm URL changes to `/onboarding/upload-logo`. Go back. Click No — confirm URL changes to `/onboarding/location`.

- [ ] **4. FileUpload component**
  Spec ref: `spec.md > File Structure > components/FileUpload.tsx`
  What to build: Create `src/components/FileUpload.tsx` — a reusable drag-and-drop image upload component. It should accept image files (PNG, JPG, WebP), show a visual drop zone, display a preview of the uploaded image(s), and expose the image data as base64 strings via a callback prop. Support both single-file mode (for logo upload) and multi-file mode (for competitor uploads).
  Acceptance: Component renders a drop zone. Dragging an image onto it shows a preview. Clicking the zone opens a file picker. In single-file mode, uploading replaces the previous image. In multi-file mode, images accumulate in a gallery. Base64 data is accessible via the callback.
  Verify: Temporarily render the FileUpload component on any page. Upload an image via drag-and-drop and via click. Confirm the preview displays. Test both single and multi-file modes.

- [ ] **5. Upload Logo page**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow > Upload Logo`
  What to build: Build `src/app/onboarding/upload-logo/page.tsx`. Uses the FileUpload component in single-file mode for the user's logo. Shows a preview of the uploaded image. Has a "Next" button that navigates to `/onboarding/competitors`. Store the uploaded logo data in component state (IndexedDB integration is Person 4's job — just hold it in state or context for now).
  Acceptance: Page shows a file upload area for the logo. Uploading an image shows a preview. "Next" button appears and navigates to `/onboarding/competitors`.
  Verify: Run dev server, navigate to `/onboarding/upload-logo`. Upload an image. Confirm preview shows. Click "Next" — confirm URL changes to `/onboarding/competitors`.

- [ ] **6. Competitors page**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow > Competitors`
  What to build: Build `src/app/onboarding/competitors/page.tsx`. Uses the FileUpload component in multi-file mode. Shows a gallery preview of all uploaded competitor images. Has a "Next" button that navigates to `/onboarding/location`.
  Acceptance: Page allows uploading one or more competitor images. Each upload appears in a gallery preview. "Next" button navigates to `/onboarding/location`.
  Verify: Run dev server, navigate to `/onboarding/competitors`. Upload 2-3 images. Confirm they all appear in the gallery. Click "Next" — confirm URL changes to `/onboarding/location`.

- [ ] **7. Location page**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow > Location`
  What to build: Build `src/app/onboarding/location/page.tsx`. Simple page with a text input for the user's business city/region. Use a shadcn/ui Input component. Has a "Next" button that navigates to `/onboarding/industry`.
  Acceptance: Page shows a text input with a clear label/placeholder like "Where is your business located?". "Next" button navigates to `/onboarding/industry`.
  Verify: Run dev server, navigate to `/onboarding/location`. Type a city name. Click "Next" — confirm URL changes to `/onboarding/industry`.

- [ ] **8. Industry page**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow > Industry`
  What to build: Build `src/app/onboarding/industry/page.tsx`. Display a grid of selectable industry categories: Restaurant / Food & Drink, Retail / Shopping, Tech / Software, Health & Wellness, Education, Real Estate, Political Campaign, Entertainment / Events, Professional Services, Other (with a text input that appears when selected). Use shadcn/ui Card or Button components for each option. Selecting one highlights it. "Next" button navigates to `/rating` (Person 2's page — it can be a blank page for now).
  Acceptance: Industry grid displays all 10 categories. Clicking one highlights it. Clicking another switches the selection. Selecting "Other" shows a text input. "Next" button navigates to `/rating`.
  Verify: Run dev server, navigate to `/onboarding/industry`. Click through several categories and confirm only one is selected at a time. Select "Other" — confirm text input appears. Click "Next" — confirm URL changes to `/rating`.

- [ ] **9. StepWizard and Framer Motion page transitions**
  Spec ref: `spec.md > Frontend Pages > Onboarding Flow` ("Each screen is a separate page with Framer Motion transitions between them")
  What to build: Create `src/components/StepWizard.tsx` — a wrapper component that adds Framer Motion enter/exit animations to page content. Apply it to all onboarding pages and the landing page so navigating between them has smooth slide or fade transitions. This is the polish pass that makes the onboarding flow feel seamless in the demo.
  Acceptance: Navigating from the landing page through all onboarding steps shows animated transitions (no hard cuts between pages). Animations feel smooth and fast (200-400ms). Going forward and backward both animate cleanly.
  Verify: Run dev server and click through the entire flow: landing → upload logo → competitors → location → industry. Confirm every page transition is animated. Use the browser back button and confirm reverse transitions also work.

- [ ] **10. Prepare and record Devpost demo video**
  Spec ref: `spec.md > Demo Flow` + `prd.md > What We're Building`
  What to build: Script a 2-5 minute demo walkthrough as a team. Person 1's section covers the first ~30 seconds: animated landing page (3 sec), "I have a logo" path with logo + competitor upload (15 sec), location + industry input (10 sec). The wow moments are the animated background making a strong first impression and the smooth onboarding transitions. Record with clear audio and visible UI. Reference [Devpost's demo video tips](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video).
  Acceptance: Video clearly shows the full app working end-to-end. Problem statement is stated upfront. Core user flow is demonstrated through all team members' sections. Audio is clear and narration is coherent.
  Verify: Watch the recording end to end. Would a judge who knows nothing about your project understand what it does and why it matters?
