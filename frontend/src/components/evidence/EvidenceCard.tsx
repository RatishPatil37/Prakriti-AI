import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Lock, Globe } from 'lucide-react';

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
    <div className="bg-white border border-earth-border rounded-xl p-3.5 shadow-sm hover:border-forest-600/40 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-forest-600/10 text-forest-600 border border-forest-600/20">
            [{item.id}]
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-evergreen/80">
            {item.organization}
          </span>
          {item.publication_year && (
            <span className="text-xs text-evergreen/50">
              ({item.publication_year})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {item.scope === 'private' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Lock className="w-2.5 h-2.5" />
              Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Globe className="w-2.5 h-2.5" />
              Public
            </span>
          )}
        </div>
      </div>

      <h4 className="text-sm font-medium text-evergreen mt-2 leading-snug">
        {item.title}
      </h4>

      {(item.page || item.section) && (
        <div className="flex items-center gap-2 text-[11px] text-evergreen/60 mt-1 font-mono">
          {item.page && <span>Page {item.page}</span>}
          {item.section && <span>• Section {item.section}</span>}
        </div>
      )}

      {/* Excerpt */}
      <div className="mt-2.5 pt-2 border-t border-earth-border/60">
        <p className={`text-xs text-evergreen/75 leading-relaxed font-sans ${expanded ? '' : 'line-clamp-2'}`}>
          "{item.text}"
        </p>
        
        <div className="flex items-center justify-between mt-2 pt-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-forest-600 hover:text-forest-500 transition"
          >
            {expanded ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Read excerpt <ChevronDown className="w-3 h-3" /></>
            )}
          </button>

          {(item.doi || item.source_url) && (
            <a
              href={item.source_url || `https://doi.org/${item.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-evergreen/50 hover:text-forest-600 transition"
            >
              DOI / Source <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
