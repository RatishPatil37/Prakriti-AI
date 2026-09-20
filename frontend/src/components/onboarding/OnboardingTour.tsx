import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, Check, Compass } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  bulletPoints: string[];
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-context-btn',
    title: 'Site Parameters & Baseline Calibration',
    description: 'Recommendations require site-specific grounding to avoid theoretical guesswork.',
    bulletPoints: [
      'Define your local soil texture, pH, annual rainfall, and climate zone.',
      'Calibrate models for degraded vertisols, sandy drylands, or humid basins.',
      'Access rapid presets (e.g., Semi-Arid Wheat, Degraded Pasture).',
    ],
    preferredPlacement: 'bottom',
  },
  {
    targetId: 'tour-composer',
    title: 'Scientific Research Composer',
    description: 'Ask precise ecological questions or paste your lab soil test results.',
    bulletPoints: [
      'Query carbon stabilization, mycorrhizal dynamics, and cover cropping.',
      'Ask complex multi-variable inquiries without conversational fluff.',
      'Keyboard submit with Enter (Shift+Enter for multi-line field notes).',
    ],
    preferredPlacement: 'top',
  },
  {
    targetId: 'tour-sources-btn',
    title: 'Peer-Reviewed Evidence Rail & Citations',
    description: 'Every statement made by Prakriti is strictly grounded and citation-gated.',
    bulletPoints: [
      'Inline tags like [S1], [S2] link directly to peer-reviewed sources.',
      'Hover over citations to inspect excerpts, publication dates, and DOIs.',
      'Uncited candidate chunks and off-topic questions cite zero sources.',
    ],
    preferredPlacement: 'left',
  },
  {
    targetId: 'tour-knowledge-btn',
    title: 'Private Field Knowledge Vault',
    description: 'Securely upload custom farm audits, hydrological surveys, and PDF assessments.',
    bulletPoints: [
      'Documents are parsed and indexed into an encrypted vector partition.',
      'Multi-tenant isolation guarantees your private field data is never leaked.',
      'Manage, inspect, or delete private files anytime.',
    ],
    preferredPlacement: 'right',
  },
];

const TOUR_STORAGE_KEY = 'prakriti_tour_completed';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 120, left: 120 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target rect and card position dynamically
  const updatePosition = () => {
    if (!isOpen || !step) return;

    const el = document.getElementById(step.targetId);
    if (!el) {
      // Fallback: center in viewport
      setTargetRect(null);
      setCardPos({
        top: Math.max(80, window.innerHeight / 2 - 140),
        left: Math.max(20, window.innerWidth / 2 - 180),
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Calculate optimal popover position
    const cardWidth = 380;
    const cardHeight = 260;
    const padding = 16;

    let top = rect.bottom + padding;
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    if (step.preferredPlacement === 'top' || (rect.bottom + cardHeight > window.innerHeight && rect.top > cardHeight + padding)) {
      top = rect.top - cardHeight - padding;
    } else if (step.preferredPlacement === 'left' && rect.left > cardWidth + padding) {
      top = Math.max(20, rect.top + rect.height / 2 - cardHeight / 2);
      left = rect.left - cardWidth - padding;
    } else if (step.preferredPlacement === 'right' && rect.right + cardWidth + padding < window.innerWidth) {
      top = Math.max(20, rect.top + rect.height / 2 - cardHeight / 2);
      left = rect.right + padding;
    }

    // Viewport clamping
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));
    top = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, top));

    setCardPos({ top, left });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = setTimeout(updatePosition, 100);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, currentStepIndex]);

  const handleFinish = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={handleFinish}
      />

      {/* Target Element Spotlight Ring (Image 2 style) */}
      {targetRect && (
        <div
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          className="fixed rounded-2xl pointer-events-none ring-2 ring-emerald-400 shadow-[0_0_35px_rgba(46,125,82,0.45)] transition-all duration-300 z-50 animate-pulse"
        />
      )}

      {/* Floating Tour Popover Box (Smoothly glides between coordinates) */}
      <div
        ref={cardRef}
        style={{
          top: cardPos.top,
          left: cardPos.left,
          width: 380,
          transition: 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="fixed z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn"
      >
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
              {currentStepIndex + 1}
            </span>
            <span className="text-xs font-mono font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition cursor-pointer"
            title="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight font-sans">
            {step.title}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {step.description}
          </p>

          <ul className="space-y-1.5 pt-1">
            {step.bulletPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span className="leading-snug">{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="btn-ghost text-xs py-1.5 px-3 rounded-xl disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentStepIndex
                    ? 'w-4 bg-emerald-400'
                    : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="btn-primary text-xs py-1.5 px-3.5 rounded-xl cursor-pointer"
          >
            {currentStepIndex === TOUR_STEPS.length - 1 ? (
              <span className="flex items-center gap-1">
                Finish <Check className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
