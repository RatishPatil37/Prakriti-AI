import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { EvidenceCard } from './EvidenceCard';

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
}

const qualityConfig = {
  STRONG:       { label: 'Strong evidence',    dot: '#6BAF82', bg: 'rgba(78,136,98,0.08)', border: 'rgba(78,136,98,0.25)', text: '#6BAF82' },
  MODERATE:     { label: 'Moderate evidence',  dot: '#60A5FA', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  LIMITED:      { label: 'Limited evidence',   dot: '#FBBF24', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', text: '#FBBF24' },
  INSUFFICIENT: { label: 'Needs more data',    dot: '#F87171', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.2)', text: '#F87171' },
};

export const EvidencePanel: React.FC<Props> = ({
  evidenceList,
  qualityAssessment,
  citationsVerified,
}) => {
  const quality = qualityAssessment
    ? (qualityConfig[qualityAssessment.status?.toUpperCase() as keyof typeof qualityConfig] ?? qualityConfig.INSUFFICIENT)
    : null;

  return (
    <aside className="w-72 xl:w-80 flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden hidden lg:flex">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Sources
          </h3>
        </div>
        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
          {evidenceList.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {/* Source cards */}
        <div className="space-y-2">
          {evidenceList.map((item) => (
            <EvidenceCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
};
