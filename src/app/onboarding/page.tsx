"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import StepWizard from "@/components/StepWizard";
import PuzzleBlock from "@/components/onboarding/PuzzleBlock";
import LogoSection from "@/components/onboarding/sections/LogoSection";
import CompetitorSection from "@/components/onboarding/sections/CompetitorSection";
import LocationSection from "@/components/onboarding/sections/LocationSection";
import IndustrySection from "@/components/onboarding/sections/IndustrySection";
import { puzzleEnter, puzzleSpring, fadeBlur, EASE_SMOOTH } from "@/lib/motion";

/* ── State ── */

type Step = 0 | 1 | 2 | 3 | 4;

interface State {
  currentStep: Step;
  highestStep: Step;
  logo: string | null;
  competitorImages: string[];
  location: string;
  industry: string;
}

type Action =
  | { type: "COMPLETE_LOGO"; logo: string }
  | { type: "COMPLETE_COMPETITORS"; images: string[] }
  | { type: "COMPLETE_LOCATION"; location: string }
  | { type: "COMPLETE_INDUSTRY"; industry: string }
  | { type: "EDIT_STEP"; step: Step };

const initialState: State = {
  currentStep: 0,
  highestStep: 0,
  logo: null,
  competitorImages: [],
  location: "",
  industry: "",
};

function nextStep(state: State, naturalNext: Step): Step {
  // If re-editing a previous step and all steps were already completed,
  // jump back to the assembled view (step 4) instead of the natural next
  if (state.highestStep === 4) return 4;
  return Math.max(naturalNext, (state.currentStep + 1) as Step) as Step;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "COMPLETE_LOGO": {
      const step = nextStep(state, 1);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, logo: action.logo };
    }
    case "COMPLETE_COMPETITORS": {
      const step = nextStep(state, 2);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, competitorImages: action.images };
    }
    case "COMPLETE_LOCATION": {
      const step = nextStep(state, 3);
      return { ...state, currentStep: step, highestStep: Math.max(state.highestStep, step) as Step, location: action.location };
    }
    case "COMPLETE_INDUSTRY":
      return { ...state, currentStep: 4, highestStep: 4, industry: action.industry };
    case "EDIT_STEP":
      return { ...state, currentStep: action.step };
    default:
      return state;
  }
}

/* ── Sections config ── */

const SLOTS = ["logo", "competitor", "location", "industry"] as const;

/* ── Page ── */

export default function OnboardingPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentStep } = state;
  const isAssembled = currentStep === 4;

  const handleGenerate = () => {
    const current = JSON.parse(
      sessionStorage.getItem("marketeer-campaign") || "{}"
    );
    sessionStorage.setItem(
      "marketeer-campaign",
      JSON.stringify({
        ...current,
        userLogo: state.logo?.split(",")[1] ?? null,
        competitorLogos: state.competitorImages.map((f) => f.split(",")[1]),
        location: state.location,
        industry: state.industry,
      })
    );
    router.push("/rating");
  };

  // Which slots are completed (visible as chips) — any slot that has data
  // and isn't the currently active one
  const completedSlots = SLOTS.filter((_, i) => {
    if (isAssembled) return false;
    if (i === currentStep) return false;
    return i < state.highestStep;
  });

  return (
    <StepWizard>
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <LayoutGroup>
          {/* ── Assembled puzzle grid (step 4) ── */}
          {isAssembled ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
              className="w-full max-w-3xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">
                  Review your campaign
                </h1>
                <p className="text-white/50">
                  Make sure everything looks right. Click any card to make
                  changes.
                </p>
              </div>

              <div className="grid gap-3 w-full puzzle-grid">
                <PuzzleBlock
                  layoutId="logo"
                  mode="grid"
                  style={{ gridArea: "logo" }}
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 0 })}
                >
                  <LogoSection
                    isActive={false}
                    logo={state.logo}
                    onComplete={() => {}}
                  />
                </PuzzleBlock>

                <PuzzleBlock
                  layoutId="location"
                  mode="grid"
                  style={{ gridArea: "location" }}
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 2 })}
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
                  style={{ gridArea: "competitor" }}
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
                  style={{ gridArea: "industry" }}
                  onClick={() => dispatch({ type: "EDIT_STEP", step: 3 })}
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
                  Generate Campaign
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
                        onComplete={(logo) =>
                          dispatch({ type: "COMPLETE_LOGO", logo })
                        }
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

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
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
