import React from 'react';
import { ShieldCheck, Zap, Layers, ArrowRight } from 'lucide-react';
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
  metrics: {
    auth_ms?: number;
    retrieval_ms?: number;
    prompt_ms?: number;
    llm_ttft_ms?: number;
    first_sse_ms?: number;
    total_ms?: number;
  } | null;
  citationsVerified?: boolean | null;
}

export const EvidenceRail: React.FC<Props> = ({
  evidenceList,
  qualityAssessment,
  metrics,
  citationsVerified
}) => {
  const getQualityBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'STRONG':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Strong Scientific Evidence'
        };
      case 'MODERATE':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          label: 'Moderate Evidence'
        };
      case 'LIMITED':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Limited Field Evidence'
        };
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          label: 'Insufficient Evidence'
        };
    }
  };

  const badge = qualityAssessment ? getQualityBadge(qualityAssessment.status) : null;

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 border-l border-earth-border bg-botanical-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-earth-border bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-forest-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-evergreen">
            Scientific Evidence Rail
          </h3>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-earth-100 text-evergreen/70">
          {evidenceList.length} Sources
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Evidence Quality Assessment Badge */}
        {badge && (
          <div className={`p-3 rounded-xl border ${badge.bg}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
              <span className="text-xs font-bold uppercase tracking-wide">
                {badge.label}
              </span>
            </div>
            {qualityAssessment?.reasons && qualityAssessment.reasons.length > 0 && (
              <p className="text-[11px] mt-1.5 opacity-85 leading-snug">
                {qualityAssessment.reasons[0]}
              </p>
            )}
            {citationsVerified !== undefined && citationsVerified !== null && (
              <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1.5 text-[11px] font-medium">
                {citationsVerified ? (
                  <span className="text-emerald-700">✓ All cited [S#] IDs verified in manifest</span>
                ) : (
                  <span className="text-amber-700">⚠ Unverified citation ID detected in stream</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-Metric Causal Chain Scaffold */}
        <div className="bg-white border border-earth-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-evergreen mb-2.5">
            <Layers className="w-3.5 h-3.5 text-forest-600" />
            <span>Multi-Metric Reasoning Chain</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-evergreen/80 flex-wrap">
            <span className="px-2 py-1 rounded bg-earth-100 font-medium">SOC (0.3%)</span>
            <ArrowRight className="w-3 h-3 text-evergreen/40" />
            <span className="px-2 py-1 rounded bg-earth-100 font-medium">Moisture Retention</span>
            <ArrowRight className="w-3 h-3 text-evergreen/40" />
            <span className="px-2 py-1 rounded bg-forest-600/10 text-forest-600 font-semibold">Pollinator Diversity</span>
          </div>
        </div>

        {/* Performance & TTFT Metrics */}
        {metrics && (
          <div className="bg-white border border-earth-border rounded-xl p-3 shadow-sm font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-evergreen mb-2">
              <Zap className="w-3.5 h-3.5 text-limeaccent-500" />
              <span>Latency & TTFT Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-evergreen/70">
              <div>
                <span className="text-[10px] text-evergreen/50 block">Warm TTFT</span>
                <span className="font-bold text-evergreen">{metrics.llm_ttft_ms ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-evergreen/50 block">Retrieval (RRF)</span>
                <span className="font-bold text-evergreen">{metrics.retrieval_ms ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-evergreen/50 block">First SSE Write</span>
                <span className="font-bold text-evergreen">{metrics.first_sse_ms ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-evergreen/50 block">Total Pipeline</span>
                <span className="font-bold text-forest-600">{metrics.total_ms ?? 0} ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Retrieved Evidence Source Cards */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-evergreen/60">
            Retrieved Scientific Citations
          </div>
          {evidenceList.length === 0 ? (
            <div className="text-xs text-evergreen/50 p-4 border border-dashed border-earth-border rounded-xl text-center">
              Retrieved evidence cards will appear here during query reasoning.
            </div>
          ) : (
            evidenceList.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
