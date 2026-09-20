import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, SquarePen, CornerDownLeft, Sparkles } from 'lucide-react';

interface Props {
  clarificationData: {
    message?: string;
    suggested_questions?: string[];
  };
  onAnswerClarification: (answer: string) => void;
  onDismiss: () => void;
}

interface QuestionOption {
  id: string;
  label: string;
  detail?: string;
}

// Contextual realistic options mapped by question theme
const getOptionsForQuestion = (question: string): QuestionOption[] => {
  const qLower = question.toLowerCase();

  if (qLower.includes('texture') || qLower.includes('soil type') || qLower.includes('soil')) {
    return [
      { id: '1', label: 'Sandy loam / coarse sand', detail: 'High infiltration, rapid percolation, low organic matter' },
      { id: '2', label: 'Loam / silt loam', detail: 'Balanced moisture retention and drainage' },
      { id: '3', label: 'Clay / heavy vertisol', detail: 'High water-holding capacity, swelling/shrinking cracks' },
      { id: '4', label: 'Shallow rocky / skeletal soil', detail: 'Restricted rooting depth and low nutrient reservoir' },
    ];
  }

  if (qLower.includes('tillage') || qLower.includes('disturbance') || qLower.includes('management')) {
    return [
      { id: '1', label: 'Intensive conventional tillage', detail: 'Deep moldboard plowing (>15 cm) with complete inversion' },
      { id: '2', label: 'Conservation / reduced strip-tillage', detail: 'Disturbing only the seed row with partial residue retention' },
      { id: '3', label: 'Continuous zero-tillage (no-till)', detail: 'Direct drilling with standing stubble and mulch retention' },
      { id: '4', label: 'Perennial cover cropped / silvopasture', detail: 'Living roots year-round with perennial canopy integration' },
    ];
  }

  if (qLower.includes('rain') || qLower.includes('water') || qLower.includes('moisture') || qLower.includes('irrigation')) {
    return [
      { id: '1', label: 'Arid / semi-arid dryland (<400 mm/year)', detail: 'Dependent on erratic seasonal monsoons or winter rains' },
      { id: '2', label: 'Sub-humid rainfed (500–800 mm/year)', detail: 'Adequate seasonal precipitation with periodic dry spells' },
      { id: '3', label: 'Humid / high rainfall (>1000 mm/year)', detail: 'Excess moisture risk, potential runoff and nutrient leaching' },
      { id: '4', label: 'Irrigated / supplemental water available', detail: 'Drip or furrow irrigation to buffer crop water stress' },
    ];
  }

  if (qLower.includes('ph') || qLower.includes('salinity') || qLower.includes('nutrient')) {
    return [
      { id: '1', label: 'Alkaline / calcareous (pH > 7.5)', detail: 'High free carbonates, potential zinc/iron fixation' },
      { id: '2', label: 'Neutral to slightly acidic (pH 6.2 – 7.2)', detail: 'Optimal nutrient availability and active microbial biomass' },
      { id: '3', label: 'Acidic soil (pH < 5.8)', detail: 'Aluminum toxicity risk, reduced phosphorus availability' },
      { id: '4', label: 'Saline or sodic conditions (EC > 4 dS/m)', detail: 'Osmotic stress and soil structural dispersion' },
    ];
  }

  // Default ecological context choices
  return [
    { id: '1', label: 'Degraded arable land under intensive monoculture', detail: 'Low microbial biomass, declining SOC, prone to crusting' },
    { id: '2', label: 'Transitional conservation farm', detail: 'Reduced tillage with occasional cover crops or organic inputs' },
    { id: '3', label: 'Dryland pasture or silvopasture', detail: 'Grazing pressure with native perennial grasses and sparse trees' },
    { id: '4', label: 'Riparian buffer or ecological restoration zone', detail: 'Targeting biodiversity net gain and watershed stabilization' },
  ];
};

export const ClarificationQuestionnaire: React.FC<Props> = ({
  clarificationData,
  onAnswerClarification,
  onDismiss,
}) => {
  const questions = clarificationData.suggested_questions?.length
    ? clarificationData.suggested_questions
    : ['What are the baseline soil and climate conditions for this land?'];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [customText, setCustomText] = useState('');
  const [isWritingCustom, setIsWritingCustom] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex] || questions[0];
  const options = getOptionsForQuestion(currentQuestion);
  const totalQuestions = questions.length;

  // Handle keyboard shortcuts (Esc to skip, 1-4 for rapid selection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWritingCustom) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const opt = options[parseInt(e.key, 10) - 1];
        if (opt) {
          e.preventDefault();
          handleSelectOption(opt.label);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedOptionIndex(prev => (prev === null ? 0 : Math.min(options.length - 1, prev + 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedOptionIndex(prev => (prev === null ? 0 : Math.max(0, prev - 1)));
      } else if (e.key === 'Enter' && focusedOptionIndex !== null) {
        e.preventDefault();
        const opt = options[focusedOptionIndex];
        if (opt) handleSelectOption(opt.label);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isWritingCustom, focusedOptionIndex]);

  const handleSelectOption = (answerText: string) => {
    const updated = { ...selectedAnswers, [currentIndex]: answerText };
    setSelectedAnswers(updated);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsWritingCustom(false);
      setCustomText('');
      setFocusedOptionIndex(null);
    } else {
      // All questions completed, compile and submit
      const compiled = Object.entries(updated)
        .map(([idx, ans]) => `${questions[Number(idx)]}: ${ans}`)
        .join('. ');
      onAnswerClarification(compiled);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    handleSelectOption(customText.trim());
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsWritingCustom(false);
      setCustomText('');
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsWritingCustom(false);
      setCustomText('');
    }
  };

  return (
    <div className="animate-fadeIn space-y-2 max-w-2xl my-3">
      {/* Contextual Reasoning Pill (matching Claude's thought summary pill) */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-muted)] select-none">
        <Sparkles className="w-3 h-3 text-[var(--color-accent-light)]" />
        <span>Synthesized context to determine critical site parameters</span>
      </div>

      {/* Main Questionnaire Card (Image 1 reference) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-lg relative transition-all">
        {/* Card Header: Title + Pagination < 1 of 3 > + Close X */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
              {currentQuestion}
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Select the baseline closest to your site conditions
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Pagination Controls */}
            {totalQuestions > 1 && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-lg border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="hover:text-[var(--color-text-primary)] disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Previous question"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span>{currentIndex + 1} of {totalQuestions}</span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === totalQuestions - 1}
                  className="hover:text-[var(--color-text-primary)] disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Next question"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Dismiss X button */}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              title="Dismiss questionnaire"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options List */}
        <div className="py-2 divide-y divide-[var(--color-border)]/50">
          {options.map((opt, i) => {
            const isSelected = selectedAnswers[currentIndex] === opt.label;
            const isFocused = focusedOptionIndex === i;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt.label)}
                onMouseEnter={() => setFocusedOptionIndex(i)}
                className={`w-full flex items-center gap-3.5 px-2 py-3 rounded-xl text-left transition-all group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                    : isFocused
                    ? 'bg-[var(--color-surface-2)]/60 text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]/40 hover:text-[var(--color-text-primary)]'
                }`}
              >
                {/* Numbered Dark Badge (1, 2, 3, 4) */}
                <span className="w-6 h-6 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px] font-mono font-bold text-[var(--color-text-primary)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--color-accent-light)] transition">
                  {i + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] leading-tight">
                    {opt.label}
                  </p>
                  {opt.detail && (
                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                      {opt.detail}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {/* Write-In Option: "✏️ Something else" */}
          <div className="pt-2">
            {!isWritingCustom ? (
              <button
                type="button"
                onClick={() => setIsWritingCustom(true)}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]/40 transition cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-muted)] flex items-center justify-center flex-shrink-0">
                  <SquarePen className="w-3 h-3" />
                </span>
                <span className="font-medium">Something else (specify custom parameters)...</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1 px-1">
                <input
                  type="text"
                  autoFocus
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g., Vertisol with 350mm rainfall, monoculture wheat..."
                  className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-accent-light)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!customText.trim()}
                  className="btn-primary text-xs py-2 px-3 rounded-xl disabled:opacity-40"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsWritingCustom(false)}
                  className="btn-ghost text-xs py-2 px-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Action Footer: Keyboard hints & Skip button */}
        <div className="mt-2 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
          <div className="hidden sm:flex items-center gap-2">
            <span>↑↓ navigate</span>
            <span>·</span>
            <span>1-4 select</span>
            <span>·</span>
            <span>Esc skip</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto px-3 py-1 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
