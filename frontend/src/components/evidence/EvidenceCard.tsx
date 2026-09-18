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
    <div className="rounded-xl p-3.5 border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-[10px] font-semibold font-mono text-[var(--color-accent-light)] bg-[var(--color-accent-subtle)] border border-[rgba(78,136,98,0.25)] rounded px-1.5 py-0.5 flex-shrink-0">
            [{item.id}]
          </span>
          <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
            {item.organization}
          </span>
          {item.publication_year && (
            <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0">
              {item.publication_year}
            </span>
          )}
        </div>

        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium flex-shrink-0 ${
          item.scope === 'private'
            ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
            : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-light)] border border-[rgba(78,136,98,0.2)]'
        }`}>
          {item.scope === 'private' ? <Lock className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
          {item.scope === 'private' ? 'Your doc' : 'Public'}
        </span>
      </div>

      <h4 className="text-xs font-medium text-[var(--color-text-primary)] leading-snug mb-1">
        {item.title}
      </h4>

      {(item.page || item.section) && (
        <div className="text-[10px] text-[var(--color-text-muted)] mb-2">
          {item.page && `p. ${item.page}`}
          {item.page && item.section && ' · '}
          {item.section && `§${item.section}`}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-2.5 mt-1">
        <p className={`text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic ${expanded ? '' : 'line-clamp-2'}`}>
          "{item.text}"
        </p>

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> Less</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Read more</>
            )}
          </button>

          {(item.doi || item.source_url) && (
            <a
              href={item.source_url || `https://doi.org/${item.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition"
            >
              Source <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
