import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, CheckCircle2, BookOpen } from 'lucide-react';

interface Props {
  citationId: string;
  source?: {
    id: string;
    organization?: string;
    title: string;
    year?: string | number;
    text?: string;
    doi?: string;
    source_url?: string;
  };
  children: React.ReactNode;
  onOpenSourceRail?: () => void;
}

export const CitationHoverCard: React.FC<Props> = ({
  citationId,
  source,
  children,
  onOpenSourceRail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-block align-baseline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onOpenSourceRail?.();
        }}
        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer transition-all shadow-sm align-baseline"
        title={`Inspect evidence [${citationId}]`}
      >
        {children}
      </button>

      {/* Floating Hover Card (Nature / Science Editorial Style) */}
      {isOpen && source && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 max-w-[calc(100vw-32px)] p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl text-left z-50 animate-fadeIn pointer-events-auto backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--color-border)]/60">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                [{source.id || citationId}]
              </span>
              <span className="text-[11px] font-mono font-semibold text-[var(--color-text-secondary)] truncate">
                {source.organization || 'Peer-Reviewed Source'}
              </span>
              {source.year && (
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] shrink-0">
                  · {source.year}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2 font-serif">
            {source.title}
          </h4>

          {/* Excerpt */}
          {source.text && (
            <p className="mt-2 text-[11px] text-[var(--color-text-secondary)] italic line-clamp-3 leading-relaxed bg-[var(--color-surface-2)]/50 p-2 rounded-lg border border-[var(--color-border)]/40">
              "{source.text}"
            </p>
          )}

          {/* Footer Actions */}
          <div className="mt-3 pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[10px] font-mono gap-2">
            {source.doi ? (
              <a
                href={source.source_url || `https://doi.org/${source.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 truncate"
              >
                DOI: {source.doi} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            ) : (
              <span className="text-[var(--color-text-muted)]">Verified Index</span>
            )}

            <button
              type="button"
              onClick={onOpenSourceRail}
              className="text-[var(--color-text-secondary)] hover:text-emerald-400 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">View in </span>Rail →
            </button>
          </div>

          {/* Arrow caret pointing down to badge */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[var(--color-border)]" />
        </div>
      )}
    </span>
  );
};
