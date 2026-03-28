"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import StepWizard from "@/components/StepWizard";
import PuzzleBlock from "@/components/onboarding/PuzzleBlock";
import LogoSection from "@/components/onboarding/sections/LogoSection";
import CompetitorSection from "@/components/onboarding/sections/CompetitorSection";
import BrandNameSection from "@/components/onboarding/sections/BrandNameSection";
import DescriptionSection from "@/components/onboarding/sections/DescriptionSection";
import LocationSection from "@/components/onboarding/sections/LocationSection";
import IndustrySection from "@/components/onboarding/sections/IndustrySection";
import { puzzleEnter, puzzleSpring, fadeBlur, EASE_SMOOTH } from "@/lib/motion";
import { saveCampaign } from "@/lib/store";

/* ── State ── */

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface State {
  currentStep: Step;
  highestStep: Step;
  logo: string | null;
  logoSkipped: boolean;
  competitorImages: string[];
  brandName: string;
  description: string;
  location: string;
  industry: string;
}

type Action =
  | { type: "COMPLETE_LOGO"; logo: string }
  | { type: "SKIP_LOGO" }
  | { type: "COMPLETE_COMPETITORS"; images: string[] }
  | { type: "COMPLETE_BRAND_NAME"; brandName: string }
  | { type: "COMPLETE_DESCRIPTION"; description: string }
  | { type: "COMPLETE_LOCATION"; location: string }
  | { type: "COMPLETE_INDUSTRY"; industry: string }
  | { type: "EDIT_STEP"; step: Step };

const initialState: State = {
  currentStep: 0,
  highestStep: 0,
  logo: null,
  logoSkipped: false,
  competitorImages: [],
  brandName: "",
  description: "",
  location: "",
  industry: "",
};

function nextStep(state: State, naturalNext: Step): Step {
  // If re-editing a previous step and all steps were already completed,
  // jump back to the assembled view (step 6) instead of the natural next
  if (state.highestStep === 6) return 6;
  return Math.max(naturalNext, (state.currentStep + 1) as Step) as Step;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "COMPLETE_LOGO": {
      const step = nextStep(state, 1);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, logo: action.logo, logoSkipped: false };
    }
    case "SKIP_LOGO": {
      const step = nextStep(state, 1);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, logo: null, logoSkipped: true };
    }
    case "COMPLETE_COMPETITORS": {
      const step = nextStep(state, 2);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, competitorImages: action.images };
    }
    case "COMPLETE_BRAND_NAME": {
      const step = nextStep(state, 3);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, brandName: action.brandName };
    }
    case "COMPLETE_DESCRIPTION": {
      const step = nextStep(state, 4);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, description: action.description };
    }
    case "COMPLETE_LOCATION": {
      const step = nextStep(state, 5);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, location: action.location };
    }
    case "COMPLETE_INDUSTRY":
      return { ...state, currentStep: 6, highestStep: 6, industry: action.industry };
    case "EDIT_STEP":
      return { ...state, currentStep: action.step };
    default:
      return state;
  }
}

/* ── Sections config ── */

const SLOTS = ["logo", "competitor", "name", "description", "location", "industry"] as const;

/* ── Page ── */

export default function OnboardingPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentStep } = state;
  const isAssembled = currentStep === 6;

  const handleGenerate = async () => {
    const id = `campaign-${Date.now()}`;

    sessionStorage.setItem(
      "marketeer-campaign",
      JSON.stringify({
        id,
        hasLogo: state.logo !== null,
        brandName: state.brandName,
        description: state.description,
        location: state.location,
        industry: state.industry,
      })
    );

    await saveCampaign({
      id,
      createdAt: new Date(),
      hasLogo: state.logo !== null,
      userLogo: state.logo?.split(",")[1] ?? null,
      competitorLogos: state.competitorImages.map((f) => f.split(",")[1]),
      brandName: state.brandName,
      description: state.description,
      location: state.location,
      industry: state.industry,
      currentStep: "rating",
    });

    router.push("/rating");
  };

  // Which slots are completed (visible as chips) — any slot that has data
  // and isn't the currently active one
  const completedSlots = SLOTS.filter((slot, i) => {
    if (isAssembled) return false;
    if (i === currentStep) return false;
    // Logo slot counts as completed when skipped
    if (slot === "logo" && state.logoSkipped && i < state.highestStep) return true;
    return i < state.highestStep;
  });

  return (
    <StepWizard>
      {/* ── Progress indicator ── */}
      {!isAssembled && (
        <div className="flex items-center justify-center gap-0 px-4 pt-4 sm:pt-6">
          {SLOTS.map((slot, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={slot} className="flex items-center">
                {/* Step dot + label */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isCurrent
                        ? "bg-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                        : isCompleted
                          ? "bg-white/50"
                          : "bg-white/15"
                    }`}
                  />
                  <span
                    className={`text-[11px] tracking-wide capitalize transition-colors duration-500 ${
                      isCurrent
                        ? "text-white/80"
                        : isCompleted
                          ? "text-white/40"
                          : "text-white/20"
                    }`}
                  >
                    {slot === "competitor" ? "rivals" : slot}
                  </span>
                </div>
                {/* Connector line */}
                {i < SLOTS.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-px mb-5 mx-1.5 transition-colors duration-500 ${
                      i < currentStep ? "bg-white/30" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <LayoutGroup>
          {/* ── Assembled puzzle grid (step 6) ── */}
          {isAssembled ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
              className="w-full max-w-3xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">
                  review your campaign
                </h1>
                <p className="text-white/50">
                  make sure everything looks right. click any card to make
                  changes.
                </p>
              </div>

              <div className="grid gap-3 w-full puzzle-grid">
                <PuzzleBlock
                  layoutId="logo"
                  mode="grid"
                  className="puzzle-grid-logo"
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 0 })}
                >
                  <LogoSection
                    isActive={false}
                    logo={state.logo}
                    skipped={state.logoSkipped}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>

                <PuzzleBlock
                  layoutId="name"
                  mode="grid"
                  className="puzzle-grid-name"
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 2 })}
                >
                  <BrandNameSection
                    isActive={false}
                    brandName={state.brandName}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>

                <PuzzleBlock
                  layoutId="description"
                  mode="grid"
                  className="puzzle-grid-description"
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 3 })}
                >
                  <DescriptionSection
                    isActive={false}
                    description={state.description}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>

                <PuzzleBlock
                  layoutId="location"
                  mode="grid"
                  className="puzzle-grid-location"
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 4 })}
                >
                  <LocationSection
                    isActive={false}
                    location={state.location}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>

                <PuzzleBlock
                  layoutId="competitor"
                  mode="grid"
                  className="puzzle-grid-competitor"
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 1 })}
                >
                  <CompetitorSection
                    isActive={false}
                    images={state.competitorImages}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>

                <PuzzleBlock
                  layoutId="industry"
                  mode="grid"
                  className="puzzle-grid-industry"
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 5 })}
                >
                  <IndustrySection
                    isActive={false}
                    industry={state.industry}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>
              </div>

              <motion.div
                variants={fadeBlur}
                initial="hidden"
                animate="visible"
                custom={0.4}
              >
                <button
                  onClick={handleGenerate}
                  className="block w-full rounded-full bg-white py-3 text-center font-medium text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                >
                  generate campaign
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <div className="w-full max-w-xl space-y-4">
              {/* ── Completed chips row ── */}
              {completedSlots.length > 0 && (
                <motion.div
                  layout
                  className="flex flex-wrap gap-2 justify-center"
                  transition={{ layout: puzzleSpring }}
                >
                  {completedSlots.map((slot) => (
                    <PuzzleBlock
                      key={slot}
                      layoutId={slot}
                      mode="completed"
                      onClick={() =>
                        dispatch({
                          type: "EDIT_STEP",
                          step: SLOTS.indexOf(slot) as Step,
                        })
                      }
                    >
                      {slot === "logo" && (
                        <LogoSection
                          isActive={false}
                          logo={state.logo}
                          skipped={state.logoSkipped}
                          onComplete={() => {}}
                        />
                      )}
                      {slot === "competitor" && (
                        <CompetitorSection
                          isActive={false}
                          images={state.competitorImages}
                          onComplete={() => {}}
                        />
                      )}
                      {slot === "name" && (
                        <BrandNameSection
                          isActive={false}
                          brandName={state.brandName}
                          onComplete={() => {}}
                        />
                      )}
                      {slot === "description" && (
                        <DescriptionSection
                          isActive={false}
                          description={state.description}
                          onComplete={() => {}}
                        />
                      )}
                      {slot === "location" && (
                        <LocationSection
                          isActive={false}
                          location={state.location}
                          onComplete={() => {}}
                        />
                      )}
                    </PuzzleBlock>
                  ))}
                </motion.div>
              )}

              {/* ── Active section ── */}
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    variants={puzzleEnter}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <PuzzleBlock layoutId="logo" mode="active">
                      <LogoSection
                        isActive
                        logo={state.logo}
                        skipped={state.logoSkipped}
                        onComplete={(logo) =>
                          dispatch({ type: "COMPLETE_LOGO", logo })
                        }
                        onSkip={() => dispatch({ type: "SKIP_LOGO" })}
                      />
                    </PuzzleBlock>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    variants={puzzleEnter}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <PuzzleBlock layoutId="competitor" mode="active">
                      <CompetitorSection
                        isActive
                        images={state.competitorImages}
                        onComplete={(images) =>
                          dispatch({ type: "COMPLETE_COMPETITORS", images })
                        }
                      />
                    </PuzzleBlock>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    variants={puzzleEnter}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <PuzzleBlock layoutId="name" mode="active">
                      <BrandNameSection
                        isActive
                        brandName={state.brandName}
                        onComplete={(brandName) =>
                          dispatch({ type: "COMPLETE_BRAND_NAME", brandName })
                        }
                      />
                    </PuzzleBlock>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    variants={puzzleEnter}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <PuzzleBlock layoutId="description" mode="active">
                      <DescriptionSection
                        isActive
                        description={state.description}
                        onComplete={(description) =>
                          dispatch({ type: "COMPLETE_DESCRIPTION", description })
                        }
                      />
                    </PuzzleBlock>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    variants={puzzleEnter}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <PuzzleBlock layoutId="location" mode="active">
                      <LocationSection
                        isActive
                        location={state.location}
                        onComplete={(location) =>
                          dispatch({ type: "COMPLETE_LOCATION", location })
                        }
                      />
                    </PuzzleBlock>
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div
                    key="step-5"
                    variants={puzzleEnter}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <PuzzleBlock layoutId="industry" mode="active">
                      <IndustrySection
                        isActive
                        industry={state.industry}
                        onComplete={(industry) =>
                          dispatch({ type: "COMPLETE_INDUSTRY", industry })
                        }
                      />
                    </PuzzleBlock>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </LayoutGroup>
      </div>
    </StepWizard>
  );
}
