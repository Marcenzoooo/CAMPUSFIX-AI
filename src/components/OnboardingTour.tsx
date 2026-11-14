import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Compass,
  LayoutDashboard,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import type { ModuleId } from '../types';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: ModuleId) => void;
}

const TOUR_STEPS: {
  title: string;
  body: string;
  module: ModuleId;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    title: '1. Unified Campus Command Center',
    body: 'Inspect the interactive 3D campus topology, switch buildings, monitor open facility tickets, and track live activity across your department.',
    module: 'overview',
    actionLabel: 'Go to Overview',
    icon: LayoutDashboard,
  },
  {
    title: '2. Nova AI Academic Mentor',
    body: 'Chat with Nova 3D, upload lecture PDFs for grounded Q&A, build personalized 5-day exam study roadmaps, and run diagnostic quizzes.',
    module: 'mentor',
    actionLabel: 'Try AI Mentor',
    icon: Bot,
  },
  {
    title: '3. AI-Triaged CampusFix & Smart Rooms',
    body: 'Report infrastructure issues with instant Gemini priority classification or adjust smart classroom HVAC, lighting, and reservations.',
    module: 'campusfix',
    actionLabel: 'Open CampusFix',
    icon: Wrench,
  },
  {
    title: '4. Universal Search & Accessible Mobility',
    body: 'Press Cmd/Ctrl + K anytime to jump across modules, Vault notes, Lost & Found matches, and step-free campus routes.',
    module: 'mobility',
    actionLabel: 'Explore Mobility',
    icon: Compass,
  },
];

export function OnboardingTour({ open, onClose, onNavigate }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#19171D]/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="CAMPUSFIX AI Guided Tour"
    >
      <div className="bg-white dark:bg-[#1E1B24] border border-[#E8E4E9] dark:border-[#342E3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#E84D96]">
            <Sparkles className="w-4 h-4" />
            Smart Campus Guide ({step + 1} / {TOUR_STEPS.length})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#77727D] hover:text-[#19171D] dark:hover:text-white cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F8E7EF] dark:bg-[#E84D96]/20 text-[#E84D96] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#19171D] dark:text-white">{current.title}</h3>
            <p className="mt-1.5 text-sm text-[#574148] dark:text-[#C5BECF] leading-relaxed">
              {current.body}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx)}
              className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                idx === step ? 'bg-[#E84D96]' : 'bg-[#E8E4E9] dark:bg-[#342E3D]'
              }`}
              aria-label={`Step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onNavigate(current.module);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E84D96] hover:underline cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            {current.actionLabel}
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#E8E4E9] dark:border-[#342E3D] text-xs font-medium text-[#302B35] dark:text-white cursor-pointer"
              >
                Back
              </button>
            )}
            {step < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#19171D] dark:bg-[#E84D96] text-white text-xs font-semibold cursor-pointer"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#E84D96] text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
