import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, X } from 'lucide-react';
import { EvidenceCard } from './EvidenceCard';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 300;

interface Props {
  evidenceList: any[];
  qualityAssessment: {
    status: string;
    reasons: string[];
    sources_count: number;
    independent_orgs: string[];
    has_primary_evidence: boolean;
  } | null;
  citationsVerified?: boolean | null;
  onClose?: () => void;
}

const qualityConfig = {
  STRONG:       { label: 'Strong',    dot: 'var(--color-accent-light)', bg: 'var(--color-accent-subtle)', border: 'var(--color-accent-subtle-hover)', text: 'var(--color-accent-light)' },
  MODERATE:     { label: 'Moderate',  dot: '#60A5FA', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)', text: '#60A5FA' },
  LIMITED:      { label: 'Limited',   dot: '#FBBF24', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', text: '#FBBF24' },
  INSUFFICIENT: { label: 'Insufficient data', dot: '#F87171', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.18)', text: '#F87171' },
};

export const EvidencePanel: React.FC<Props> = ({
  evidenceList,
  qualityAssessment,
  citationsVerified,
  onClose,
}) => {
  const quality = qualityAssessment
    ? (qualityConfig[qualityAssessment.status?.toUpperCase() as keyof typeof qualityConfig] ?? qualityConfig.INSUFFICIENT)
    : null;

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    // Panel is on the right side, dragging left (toward 0) increases width
    const delta = startX.current - e.clientX;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setWidth(newWidth);
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* ── Mobile Backdrop Overlay (< lg) ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel: Slide-over Drawer on mobile (< lg), Docked Sidebar on desktop (lg+) ── */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[340px] sm:max-w-md lg:static lg:z-auto lg:h-full lg:max-w-none flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden shadow-2xl lg:shadow-none animate-slideLeft lg:animate-none"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? width : undefined }}
      >
        {/* ── Drag handle (left edge, desktop only) ── */}
        <div
          onMouseDown={onMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group items-center justify-center hover:bg-[var(--color-accent)]/20 transition-colors hidden lg:flex"
          title="Drag to resize"
        >
          <div className="w-0.5 h-10 rounded-full bg-[var(--color-border)] group-hover:bg-[var(--color-accent-light)] transition-colors" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0 lg:ml-1.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-accent-light)] lg:hidden" />
            <span className="section-label">Evidence & Sources</span>
            {evidenceList.length > 0 && (
              <span className="text-[10px] font-mono text-[var(--color-accent-light)] bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-accent-subtle-hover)] font-semibold">
                {evidenceList.length}
              </span>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              title="Close sources panel"
              aria-label="Close sources panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 lg:ml-1.5">
          {/* Quality badge */}
          {quality && (
            <div
              className="rounded-xl p-3 border"
              style={{ background: quality.bg, borderColor: quality.border }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: quality.dot }} />
                <span className="text-xs font-semibold" style={{ color: quality.text }}>
                  {quality.label}
                </span>
              </div>
              {qualityAssessment?.reasons?.[0] && (
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {qualityAssessment.reasons[0]}
                </p>
              )}
              {citationsVerified !== undefined && citationsVerified !== null && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {citationsVerified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-accent-light)]" />
                      <span className="text-[var(--color-accent-light)]">All sources verified</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400">Some sources unverified</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Source cards or empty state */}
          {evidenceList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                When a response references peer-reviewed research, citations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-[var(--color-border)]">
              {evidenceList.map((item, idx) => (
                <EvidenceCard key={item.id} item={item} index={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
