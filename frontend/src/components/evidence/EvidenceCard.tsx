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
  index?: number;
}

export const EvidenceCard: React.FC<EvidenceItemProps> = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);
  const num = index !== undefined ? String(index).padStart(2, '0') : item.id;

  return (
    <div className="py-3.5 px-4 hover:bg-[var(--color-surface-2)] transition-colors">
      <div className="flex items-start gap-3">
        {/* Index number in IBM Plex Serif */}
        <span
          className="flex-shrink-0 text-[var(--color-text-muted)] font-mono text-[10px] mt-0.5 w-5 text-right"
          style={{ fontFamily: "'IBM Plex Serif', Georgia, serif" }}
        >
          {num}
        </span>

        <div className="flex-1 min-w-0">
          {/* Organization + year + scope */}
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[10px] font-semibold font-mono text-[var(--color-accent-light)]">
              [{item.id}]
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] truncate">
              {item.organization}
              {item.publication_year ? `, ${item.publication_year}` : ''}
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium flex-shrink-0 ${
              item.scope === 'private'
                ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-light)] border border-[var(--color-accent-subtle-hover)]'
            }`}>
              {item.scope === 'private' ? <Lock className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
              {item.scope === 'private' ? 'Private' : 'Public'}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs font-medium text-[var(--color-text-primary)] leading-snug mb-1">
            {item.title}
          </h4>

          {(item.page || item.section) && (
            <div className="text-[10px] text-[var(--color-text-muted)] mb-1.5 font-mono">
              {item.page && `p. ${item.page}`}
              {item.page && item.section && ' · '}
              {item.section && `§${item.section}`}
            </div>
          )}

          {/* Excerpt */}
          <p className={`text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic ${expanded ? '' : 'line-clamp-2'}`}>
            "{item.text}"
          </p>

          <div className="flex items-center justify-between mt-1.5">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" />Less</>
              ) : (
                <><ChevronDown className="w-3 h-3" />More</>
              )}
            </button>

            {(item.doi || item.source_url) && (
              <a
                href={item.source_url || `https://doi.org/${item.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition font-mono"
              >
                {item.doi || 'Source'} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
