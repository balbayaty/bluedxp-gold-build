"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility } from "@/contexts/AccessibilityContext";

// ============================================================================
// LOCAL TYPES (self-contained for compatibility)
// ============================================================================

type CognitiveProfile =
  | "standard"
  | "adhd_friendly"
  | "dyslexia_friendly"
  | "autism_friendly"
  | "low_vision"
  | "motor_impaired"
  | "senior_friendly"
  | "custom";

type QuestionCategory =
  | "visual"
  | "cognitive"
  | "motor"
  | "attention"
  | "reading"
  | "audio"
  | "environment"
  | "experience";

interface QuestionOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
  suggestsProfile?: CognitiveProfile;
}

interface QuestionnaireQuestion {
  id: string;
  category: QuestionCategory;
  type: "single" | "multiple" | "scale" | "boolean" | "text";
  question: string;
  description?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  weight: number;
}

// ============================================================================
// QUESTIONNAIRE QUESTIONS
// ============================================================================

const QUESTIONS: QuestionnaireQuestion[] = [
  // Visual Questions
  {
    id: "text_size",
    category: "visual",
    type: "scale",
    question: "How comfortable are you with the current text size?",
    description:
      "Slide to indicate your preference. Larger values mean you prefer bigger text.",
    min: 1,
    max: 5,
    step: 1,
    required: true,
    weight: 0.9,
  },
  {
    id: "contrast_preference",
    category: "visual",
    type: "single",
    question: "How do you prefer your screen contrast?",
    description: "Higher contrast can make text easier to read.",
    options: [
      {
        value: "low",
        label: "Softer, easier on eyes",
        icon: "ri-contrast-line",
        suggestsProfile: "standard",
      },
      {
        value: "normal",
        label: "Standard contrast",
        icon: "ri-contrast-2-line",
        suggestsProfile: "standard",
      },
      {
        value: "high",
        label: "High contrast",
        icon: "ri-contrast-drop-line",
        suggestsProfile: "low_vision",
      },
      {
        value: "ultra",
        label: "Maximum contrast",
        icon: "ri-contrast-drop-2-line",
        suggestsProfile: "low_vision",
      },
    ],
    required: true,
    weight: 0.85,
  },
  {
    id: "color_vision",
    category: "visual",
    type: "single",
    question: "Do you have any color vision differences?",
    description: "This helps us optimize colors for your vision.",
    options: [
      {
        value: "none",
        label: "Standard color vision",
        icon: "ri-palette-line",
      },
      {
        value: "protanopia",
        label: "Difficulty with reds",
        icon: "ri-contrast-drop-line",
      },
      {
        value: "deuteranopia",
        label: "Difficulty with greens",
        icon: "ri-contrast-drop-line",
      },
      {
        value: "tritanopia",
        label: "Difficulty with blues",
        icon: "ri-contrast-drop-line",
      },
      {
        value: "achromatopsia",
        label: "Limited color perception",
        icon: "ri-contrast-2-fill",
      },
    ],
    required: false,
    weight: 0.95,
  },

  // Cognitive Questions
  {
    id: "focus_difficulty",
    category: "cognitive",
    type: "scale",
    question: "How often do you find it difficult to focus on tasks?",
    description: "1 = Rarely, 5 = Very often",
    min: 1,
    max: 5,
    step: 1,
    required: true,
    weight: 0.9,
  },
  {
    id: "distraction_sensitivity",
    category: "attention",
    type: "multiple",
    question: "What types of screen elements distract you most?",
    description:
      "Select all that apply. We'll minimize these in your interface.",
    options: [
      {
        value: "animations",
        label: "Moving elements and animations",
        icon: "ri-movie-line",
      },
      {
        value: "colors",
        label: "Bright or flashing colors",
        icon: "ri-palette-line",
      },
      {
        value: "popups",
        label: "Pop-ups and notifications",
        icon: "ri-notification-line",
      },
      {
        value: "clutter",
        label: "Too many options at once",
        icon: "ri-layout-grid-line",
      },
      {
        value: "sounds",
        label: "Notification sounds",
        icon: "ri-volume-up-line",
      },
      {
        value: "none",
        label: "None of these bother me",
        icon: "ri-check-line",
      },
    ],
    required: true,
    weight: 0.85,
  },

  // Reading Questions
  {
    id: "reading_difficulty",
    category: "reading",
    type: "single",
    question: "Do you experience any reading difficulties?",
    description: "This helps us optimize text presentation.",
    options: [
      {
        value: "none",
        label: "No difficulties",
        icon: "ri-book-open-line",
        suggestsProfile: "standard",
      },
      {
        value: "mild",
        label: "Sometimes letters seem to move",
        icon: "ri-eye-line",
        suggestsProfile: "dyslexia_friendly",
      },
      {
        value: "moderate",
        label: "Often struggle with long text",
        icon: "ri-file-text-line",
        suggestsProfile: "dyslexia_friendly",
      },
      {
        value: "dyslexia",
        label: "Diagnosed dyslexia",
        icon: "ri-text",
        suggestsProfile: "dyslexia_friendly",
      },
    ],
    required: true,
    weight: 0.95,
  },

  // Motor Questions
  {
    id: "mouse_precision",
    category: "motor",
    type: "scale",
    question: "How comfortable are you with precise mouse movements?",
    description: "1 = Very difficult, 5 = No issues",
    min: 1,
    max: 5,
    step: 1,
    required: true,
    weight: 0.8,
  },

  // Experience Questions
  {
    id: "tech_comfort",
    category: "experience",
    type: "single",
    question: "How would you describe your comfort with technology?",
    description: "This helps us tailor the interface complexity.",
    options: [
      {
        value: "beginner",
        label: "I prefer simple interfaces",
        icon: "ri-seedling-line",
        suggestsProfile: "senior_friendly",
      },
      {
        value: "intermediate",
        label: "I'm comfortable with most apps",
        icon: "ri-plant-line",
      },
      {
        value: "advanced",
        label: "I love complex features",
        icon: "ri-tree-line",
      },
    ],
    required: true,
    weight: 0.7,
  },

  // Break/Wellness
  {
    id: "break_preference",
    category: "cognitive",
    type: "boolean",
    question: "Would you like break reminders during long sessions?",
    description: "We can remind you to take breaks to prevent fatigue.",
    required: false,
    weight: 0.5,
  },
];

// ============================================================================
// CATEGORY INFO
// ============================================================================

const CATEGORY_INFO: Record<
  QuestionCategory,
  { name: string; icon: string; color: string }
> = {
  visual: {
    name: "Visual Preferences",
    icon: "ri-eye-line",
    color: "from-blue-500 to-cyan-500",
  },
  cognitive: {
    name: "Cognitive Style",
    icon: "ri-brain-line",
    color: "from-purple-500 to-pink-500",
  },
  motor: {
    name: "Motor Preferences",
    icon: "ri-hand-coin-line",
    color: "from-green-500 to-emerald-500",
  },
  attention: {
    name: "Attention & Focus",
    icon: "ri-focus-3-line",
    color: "from-amber-500 to-orange-500",
  },
  reading: {
    name: "Reading Comfort",
    icon: "ri-book-open-line",
    color: "from-indigo-500 to-blue-500",
  },
  audio: {
    name: "Audio & Feedback",
    icon: "ri-volume-up-line",
    color: "from-pink-500 to-rose-500",
  },
  environment: {
    name: "Work Environment",
    icon: "ri-building-line",
    color: "from-teal-500 to-cyan-500",
  },
  experience: {
    name: "Experience Level",
    icon: "ri-user-star-line",
    color: "from-yellow-500 to-amber-500",
  },
};

// ============================================================================
// PROFILE INFO
// ============================================================================

const PROFILE_NAMES: Record<CognitiveProfile, string> = {
  standard: "Standard Experience",
  adhd_friendly: "Focus-Optimized",
  dyslexia_friendly: "Reading-Optimized",
  autism_friendly: "Sensory-Friendly",
  low_vision: "Vision-Enhanced",
  motor_impaired: "Accessibility-First",
  senior_friendly: "Simplified Experience",
  custom: "Custom",
};

const PROFILE_DESCRIPTIONS: Record<CognitiveProfile, string> = {
  standard:
    "The default experience with all features enabled. Great for most users.",
  adhd_friendly:
    "Minimized distractions, progress indicators, and break reminders to help maintain focus.",
  dyslexia_friendly:
    "Enhanced readability with specialized fonts, increased spacing, and optimized colors.",
  autism_friendly:
    "Reduced sensory load with minimal animations, softer colors, and predictable layouts.",
  low_vision:
    "High contrast, larger text, and enhanced focus indicators for better visibility.",
  motor_impaired:
    "Larger touch targets, simplified interactions, and keyboard-friendly navigation.",
  senior_friendly:
    "Simplified interface with larger text, clearer buttons, and helpful guidance.",
  custom: "Create your own combination of preferences.",
};

// ============================================================================
// PROPS
// ============================================================================

interface AccessibilityQuestionnaireProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AccessibilityQuestionnaire({
  onComplete,
  onSkip,
}: AccessibilityQuestionnaireProps) {
  const { setQuestionnaireCompleted, updatePreferences } = useAccessibility();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [suggestedProfile, setSuggestedProfile] =
    useState<CognitiveProfile>("standard");

  const currentQuestion = QUESTIONS[currentStep];
  const totalSteps = QUESTIONS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Calculate suggested profile based on answers
  const calculateProfile = useCallback((): CognitiveProfile => {
    const profileScores: Record<CognitiveProfile, number> = {
      standard: 0,
      adhd_friendly: 0,
      dyslexia_friendly: 0,
      autism_friendly: 0,
      low_vision: 0,
      motor_impaired: 0,
      senior_friendly: 0,
      custom: 0,
    };

    // Analyze answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = QUESTIONS.find((q) => q.id === questionId);
      if (!question) return;

      // Check for explicit profile suggestions
      if (question.options) {
        const selectedOptions = Array.isArray(answer) ? answer : [answer];
        selectedOptions.forEach((val) => {
          const option = question.options?.find((o) => o.value === val);
          if (option?.suggestsProfile) {
            profileScores[option.suggestsProfile] += question.weight;
          }
        });
      }

      // Additional scoring based on answers
      if (questionId === "focus_difficulty" && answer >= 4) {
        profileScores.adhd_friendly += question.weight;
      }

      if (questionId === "distraction_sensitivity") {
        const distractions = answer as string[];
        if (
          distractions?.includes("animations") ||
          distractions?.includes("colors")
        ) {
          profileScores.autism_friendly += question.weight * 0.5;
          profileScores.adhd_friendly += question.weight * 0.5;
        }
      }

      if (questionId === "mouse_precision" && answer <= 2) {
        profileScores.motor_impaired += question.weight;
        profileScores.senior_friendly += question.weight * 0.5;
      }

      if (questionId === "text_size" && answer >= 4) {
        profileScores.low_vision += question.weight * 0.5;
        profileScores.senior_friendly += question.weight * 0.5;
      }
    });

    // Find highest scoring profile
    let maxScore = 0;
    let bestProfile: CognitiveProfile = "standard";

    Object.entries(profileScores).forEach(([profile, score]) => {
      if (score > maxScore && profile !== "custom") {
        maxScore = score;
        bestProfile = profile as CognitiveProfile;
      }
    });

    // Only suggest non-standard if score is significant
    return maxScore >= 1.5 ? bestProfile : "standard";
  }, [answers]);

  // Handle answer
  const handleAnswer = useCallback(
    (value: any) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion],
  );

  // Navigate
  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Calculate and show results
      const profile = calculateProfile();
      setSuggestedProfile(profile);
      setShowResults(true);
    }
  }, [currentStep, totalSteps, calculateProfile]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Apply profile
  const applyProfile = useCallback(
    (profile: CognitiveProfile) => {
      // Apply profile-specific settings
      const profileSettings: Record<CognitiveProfile, any> = {
        standard: {},
        adhd_friendly: {
          focus: { adhdMode: true, minimizeDistractions: true },
          motion: { reducedMotion: true },
        },
        dyslexia_friendly: {
          visual: { fontFamily: "dyslexic", lineHeight: 1.8, letterSpacing: 1 },
        },
        autism_friendly: {
          motion: { reducedMotion: true, disableAutoplay: true },
          visual: { saturation: 80 },
        },
        low_vision: {
          visual: { fontSize: 150, contrast: "high" },
        },
        motor_impaired: {
          focus: { focusIndicatorSize: "large" },
        },
        senior_friendly: {
          visual: { fontSize: 130, contrast: "high" },
          focus: { simplifyInterface: true },
        },
        custom: {},
      };

      if (profileSettings[profile]) {
        updatePreferences(profileSettings[profile]);
      }

      setQuestionnaireCompleted(true);
      onComplete();
    },
    [updatePreferences, setQuestionnaireCompleted, onComplete],
  );

  // Skip questionnaire
  const handleSkip = useCallback(() => {
    setQuestionnaireCompleted(true);
    onSkip();
  }, [setQuestionnaireCompleted, onSkip]);

  // Check if current answer is valid
  const isAnswerValid = useMemo(() => {
    const answer = answers[currentQuestion?.id];
    if (!currentQuestion?.required) return true;
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  }, [answers, currentQuestion]);

  // Render question content
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const categoryInfo = CATEGORY_INFO[currentQuestion.category];

    return (
      <div className="space-y-6">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center`}
          >
            <i className={`${categoryInfo.icon} text-white text-sm`}></i>
          </div>
          <span className="text-sm text-white/60">{categoryInfo.name}</span>
        </div>

        {/* Question */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {currentQuestion.question}
          </h3>
          {currentQuestion.description && (
            <p className="text-sm text-white/60">
              {currentQuestion.description}
            </p>
          )}
        </div>

        {/* Answer Input */}
        <div className="pt-4">
          {currentQuestion.type === "single" && currentQuestion.options && (
            <div className="grid gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => handleAnswer(option.value)}
                  className={`
                    w-full p-4 rounded-xl border text-left transition-all
                    ${
                      answers[currentQuestion.id] === option.value
                        ? "bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-500/30"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <div
                        className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${
                          answers[currentQuestion.id] === option.value
                            ? "bg-cyan-500/30"
                            : "bg-white/10"
                        }
                      `}
                      >
                        <i
                          className={`${option.icon} ${
                            answers[currentQuestion.id] === option.value
                              ? "text-cyan-400"
                              : "text-white/60"
                          } text-lg`}
                        ></i>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-white/50 mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {answers[currentQuestion.id] === option.value && (
                      <i className="ri-check-line text-cyan-400 ml-auto text-xl"></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multiple" && currentQuestion.options && (
            <div className="grid gap-3">
              {currentQuestion.options.map((option) => {
                const selected = (answers[currentQuestion.id] || []).includes(
                  option.value,
                );
                return (
                  <button
                    key={String(option.value)}
                    onClick={() => {
                      const current = answers[currentQuestion.id] || [];
                      if (option.value === "none") {
                        handleAnswer(["none"]);
                      } else {
                        const filtered = current.filter(
                          (v: string) => v !== "none",
                        );
                        if (selected) {
                          handleAnswer(
                            filtered.filter((v: string) => v !== option.value),
                          );
                        } else {
                          handleAnswer([...filtered, option.value]);
                        }
                      }
                    }}
                    className={`
                      w-full p-4 rounded-xl border text-left transition-all
                      ${
                        selected
                          ? "bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-500/30"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center
                        ${
                          selected
                            ? "bg-cyan-500 border-cyan-500"
                            : "border-white/30"
                        }
                      `}
                      >
                        {selected && (
                          <i className="ri-check-line text-white text-sm"></i>
                        )}
                      </div>
                      {option.icon && (
                        <i
                          className={`${option.icon} ${selected ? "text-cyan-400" : "text-white/60"} text-lg`}
                        ></i>
                      )}
                      <span className="text-white">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === "scale" && (
            <div className="space-y-4">
              <input
                type="range"
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                value={answers[currentQuestion.id] || currentQuestion.min}
                onChange={(e) => handleAnswer(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-sm text-white/50">
                <span>{currentQuestion.min}</span>
                <span className="text-lg font-bold text-cyan-400">
                  {answers[currentQuestion.id] || currentQuestion.min}
                </span>
                <span>{currentQuestion.max}</span>
              </div>
            </div>
          )}

          {currentQuestion.type === "boolean" && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className={`
                  flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-2
                  ${
                    answers[currentQuestion.id] === true
                      ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }
                `}
              >
                <i
                  className={`ri-check-line text-xl ${answers[currentQuestion.id] === true ? "text-emerald-400" : "text-white/60"}`}
                ></i>
                <span className="font-medium text-white">Yes</span>
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className={`
                  flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-2
                  ${
                    answers[currentQuestion.id] === false
                      ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }
                `}
              >
                <i
                  className={`ri-close-line text-xl ${answers[currentQuestion.id] === false ? "text-rose-400" : "text-white/60"}`}
                ></i>
                <span className="font-medium text-white">No</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render results
  const renderResults = () => {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <i className="ri-check-line text-white text-3xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Analysis Complete!
          </h3>
          <p className="text-white/60">
            Based on your responses, we recommend:
          </p>
        </div>

        {/* Recommended Profile */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <i className="ri-user-star-line text-white text-2xl"></i>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-white mb-1">
                {PROFILE_NAMES[suggestedProfile]}
              </h4>
              <p className="text-sm text-white/70">
                {PROFILE_DESCRIPTIONS[suggestedProfile]}
              </p>
            </div>
          </div>

          <button
            onClick={() => applyProfile(suggestedProfile)}
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <i className="ri-check-double-line"></i>
            Apply This Profile
          </button>
        </div>

        {/* Alternative Options */}
        <div className="space-y-3">
          <p className="text-sm text-white/50 text-center">
            Or choose a different profile:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PROFILE_NAMES)
              .filter(([key]) => key !== suggestedProfile && key !== "custom")
              .slice(0, 4)
              .map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => applyProfile(key as CognitiveProfile)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                >
                  <p className="text-sm font-medium text-white">{name}</p>
                </button>
              ))}
          </div>

          <button
            onClick={() => applyProfile("custom")}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <i className="ri-settings-3-line text-white/60"></i>
            <span className="text-sm text-white">Customize Manually</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#1f2937] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <i className="ri-magic-line text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Personalize Your Experience
                </h2>
                <p className="text-xs text-white/50">
                  {showResults
                    ? "Your results"
                    : `Question ${currentStep + 1} of ${totalSteps}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <i className="ri-close-line text-white/60 hover:text-white"></i>
            </button>
          </div>

          {/* Progress Bar */}
          {!showResults && (
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={showResults ? "results" : currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {showResults ? renderResults() : renderQuestion()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!showResults && (
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                ${
                  currentStep === 0
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <i className="ri-arrow-left-line"></i>
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-white/50 hover:text-white/70 transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={goNext}
                disabled={!isAnswerValid}
                className={`
                  px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all
                  ${
                    isAnswerValid
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  }
                `}
              >
                {currentStep === totalSteps - 1 ? "See Results" : "Next"}
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
