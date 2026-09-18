import React from 'react';
import { ShieldCheck, Zap, Layers, ArrowRight, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
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
          bg: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
          dot: 'bg-[#A9EE70]',
          label: 'Strong Scientific Evidence'
        };
      case 'MODERATE':
        return {
          bg: 'bg-blue-950/50 text-blue-300 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
          dot: 'bg-blue-400',
          label: 'Moderate Consensus'
        };
      case 'LIMITED':
        return {
          bg: 'bg-amber-950/50 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
          dot: 'bg-amber-400',
          label: 'Limited Field Evidence'
        };
      default:
        return {
          bg: 'bg-rose-950/50 text-rose-300 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]',
          dot: 'bg-rose-400',
          label: 'Insufficient Grounding'
        };
    }
  };

  const badge = qualityAssessment ? getQualityBadge(qualityAssessment.status) : null;

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 border-l border-emerald-500/10 bg-[#07130E]/95 backdrop-blur-2xl flex flex-col h-full overflow-hidden z-20">
      {/* Header */}
      <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/15 text-[#A9EE70]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-white">
            Evidence Rail
          </h3>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#A9EE70] border border-emerald-500/20">
          {evidenceList.length} Sources
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Evidence Quality Assessment Badge */}
        {badge && (
          <div className={`p-4 rounded-2xl border ${badge.bg} transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse shadow-[0_0_8px_currentColor]`} />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  {badge.label}
                </span>
              </div>
              <span className="text-[10px] font-mono opacity-60">
                {qualityAssessment?.independent_orgs?.length || 0} Orgs
              </span>
            </div>

            {qualityAssessment?.reasons && qualityAssessment.reasons.length > 0 && (
              <p className="text-[11px] mt-2 opacity-90 leading-relaxed font-sans">
                {qualityAssessment.reasons[0]}
              </p>
            )}

            {citationsVerified !== undefined && citationsVerified !== null && (
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-mono">
                {citationsVerified ? (
                  <span className="text-[#A9EE70] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A9EE70]" />
                    All cited [S#] IDs verified in manifest
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Unverified citation ID detected in stream
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-Metric Causal Chain Scaffold */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/15 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 mb-3">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#A9EE70]" />
              <span>Multi-Metric Reasoning</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans">RRF Fused</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300 flex-wrap">
            <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
              SOC (0.3%)
            </span>
            <ArrowRight className="w-3 h-3 text-[#A9EE70] animate-pulse" />
            <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
              Aggregation
            </span>
            <ArrowRight className="w-3 h-3 text-[#A9EE70] animate-pulse" />
            <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
              Moisture
            </span>
            <ArrowRight className="w-3 h-3 text-[#A9EE70] animate-pulse" />
            <span className="px-2 py-1 rounded-md bg-[#A9EE70]/15 text-[#A9EE70] border border-[#A9EE70]/40 font-bold shadow-[0_0_10px_rgba(169,238,112,0.2)]">
              Pollinators
            </span>
          </div>
        </div>

        {/* Latency & TTFT Telemetry */}
        {metrics && (
          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/15 shadow-lg font-mono text-[11px]">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-2.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#A9EE70]" />
                <span className="font-mono uppercase tracking-wider">Telemetry HUD</span>
              </div>
              <span className="text-[10px] text-[#A9EE70] flex items-center gap-1">
                <Activity className="w-3 h-3" /> LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-slate-300 pt-1">
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/10">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Warm TTFT</span>
                <span className="font-bold text-[#A9EE70] text-xs">{metrics.llm_ttft_ms ?? 0} ms</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/10">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Retrieval (RRF)</span>
                <span className="font-bold text-[#A9EE70] text-xs">{metrics.retrieval_ms ?? 0} ms</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/10">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">First SSE Write</span>
                <span className="font-bold text-slate-200 text-xs">{metrics.first_sse_ms ?? 0} ms</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/10">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Total Pipeline</span>
                <span className="font-bold text-emerald-400 text-xs">{metrics.total_ms ?? 0} ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Retrieved Evidence Source Cards */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center justify-between">
            <span>Retrieved Citations</span>
            <span className="text-[10px] text-emerald-400">RRF Top-K</span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="text-xs text-slate-500 p-6 border border-dashed border-emerald-500/20 rounded-2xl text-center bg-black/20 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500/40 mx-auto" />
              <p>Retrieved peer-reviewed citation cards will appear here during query reasoning.</p>
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
