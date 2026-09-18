import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Lock, Globe, FileText, CheckCircle2 } from 'lucide-react';

interface EvidenceItemProps {
  item: {
    id: string;
    title: string;
    organization: string;
    publication_year?: number;
    page?: number;
    section?: string;
    doi?: string;
    source_url?: string;
    text: string;
    scope: string;
    score?: number;
  };
}

export const EvidenceCard: React.FC<EvidenceItemProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel-interactive rounded-2xl p-4 border border-emerald-500/15 group relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-[#A9EE70]/15 text-[#A9EE70] border border-[#A9EE70]/30 shadow-[0_0_8px_rgba(169,238,112,0.15)]">
            [{item.id}]
          </span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
            {item.organization}
          </span>
          {item.publication_year && (
            <span className="text-[11px] text-slate-400 font-mono">
              ({item.publication_year})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.scope === 'private' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Lock className="w-2.5 h-2.5" />
              Private Vault
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Globe className="w-2.5 h-2.5" />
              Public Grounding
            </span>
          )}
        </div>
      </div>

      <h4 className="text-xs font-semibold text-slate-100 mt-2.5 leading-snug group-hover:text-white transition">
        {item.title}
      </h4>

      {(item.page || item.section) && (
        <div className="flex items-center gap-2 text-[10px] text-emerald-400/80 mt-1.5 font-mono">
          {item.page && <span>Page {item.page}</span>}
          {item.section && <span>• Section {item.section}</span>}
        </div>
      )}

      {/* Excerpt Section */}
      <div className="mt-3 pt-2.5 border-t border-emerald-500/10">
        <p className={`text-[11px] text-slate-300 leading-relaxed font-sans ${expanded ? '' : 'line-clamp-2'}`}>
          "{item.text}"
        </p>

        <div className="flex items-center justify-between mt-2.5 pt-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#A9EE70] hover:text-white transition"
          >
            {expanded ? (
              <>Collapse <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Read Excerpt <ChevronDown className="w-3 h-3" /></>
            )}
          </button>

          {(item.doi || item.source_url) && (
            <a
              href={item.source_url || `https://doi.org/${item.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-[#A9EE70] transition"
            >
              DOI / Source <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
