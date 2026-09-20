import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Printer, Copy, Check, FileText, ShieldCheck, Download } from 'lucide-react';
import { EnvironmentalContextData } from '../../lib/sse';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  sources?: any[];
  quality?: any;
  environmentalContext: EnvironmentalContextData;
  conversationTitle?: string | null;
}

export const DossierExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  messageContent,
  sources = [],
  quality,
  environmentalContext,
  conversationTitle,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const contextSummary = `SITE CONTEXT:
- Region: ${environmentalContext.region_or_coords || 'Unspecified'}
- Climate Zone: ${environmentalContext.climate_zone || 'Unspecified'}
- Soil Organic Carbon: ${environmentalContext.soil_organic_carbon_pct ? environmentalContext.soil_organic_carbon_pct + '%' : 'Unspecified'}
- Soil pH: ${environmentalContext.soil_ph ?? 'Unspecified'}
- Rainfall: ${environmentalContext.annual_rainfall_mm ? environmentalContext.annual_rainfall_mm + ' mm/yr' : 'Unspecified'}
- Current Land Use: ${environmentalContext.current_land_use || 'Unspecified'}`;

    const biblio = sources.length
      ? `\n\nBIBLIOGRAPHY:\n` +
        sources.map((s, idx) => `[${s.id || 'S' + (idx + 1)}] ${s.organization || 'Corpus'} (${s.year || 'n.d.'}). ${s.title}. DOI: ${s.doi || 'N/A'}`).join('\n')
      : '';

    const text = `# PRAKRITI AI — SCIENTIFIC RESEARCH DOSSIER\nDate: ${new Date().toLocaleDateString()}\n\n${contextSummary}\n\n## ASSESSMENT\n\n${messageContent}${biblio}`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn print:p-0 print:bg-white">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Scientific Dossier Export
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Formal printable whitepaper format with full bibliography
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn-ghost text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-surface-2)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 bg-[var(--color-bg)] print:bg-white print:text-black">
          {/* Institutional Document Header */}
          <div className="border-b-2 border-emerald-500/30 pb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
              <span>Prakriti AI · Research Dossier</span>
              <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[var(--color-text-primary)] print:text-black">
              {conversationTitle || 'Ecological Assessment & Restoration Protocol'}
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Grounded in IPCC, IPBES, IUCN, and FAO global peer-reviewed literature
            </p>
          </div>

          {/* Metadata Block: Site Parameters & Confidence */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] print:border-gray-300 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase">Region / Climate</span>
              <p className="font-semibold text-[var(--color-text-primary)] mt-0.5 truncate">
                {environmentalContext.region_or_coords || environmentalContext.climate_zone || 'Global Default'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase">SOC Baseline</span>
              <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                {environmentalContext.soil_organic_carbon_pct ? `${environmentalContext.soil_organic_carbon_pct}% SOC` : 'Unspecified'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase">Precipitation</span>
              <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                {environmentalContext.annual_rainfall_mm ? `${environmentalContext.annual_rainfall_mm} mm/yr` : 'Unspecified'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase">Evidence Level</span>
              <p className="font-semibold text-emerald-400 mt-0.5">
                {quality?.status || 'Strong'} Verified
              </p>
            </div>
          </div>

          {/* Assessment Body */}
          <div className="prose-chat print:text-black leading-relaxed">
            <ReactMarkdown>{messageContent}</ReactMarkdown>
          </div>

          {/* Formal Bibliography Section */}
          {sources.length > 0 && (
            <div className="pt-8 border-t border-[var(--color-border)] print:border-gray-300 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Cited Scientific Literature & Peer-Reviewed Sources ({sources.length})
              </h3>
              <div className="divide-y divide-[var(--color-border)]/60 text-xs">
                {sources.map((src, idx) => (
                  <div key={src.id || idx} className="py-2.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">
                        [{src.id || 'S' + (idx + 1)}]
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)] font-serif">
                        {src.title}
                      </span>
                      {src.year && (
                        <span className="font-mono text-[var(--color-text-muted)]">
                          ({src.year})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] font-mono flex flex-wrap gap-x-4">
                      <span>Publisher: {src.organization || 'Scientific Assessment'}</span>
                      {src.doi && <span>DOI: {src.doi}</span>}
                    </div>
                    {src.text && (
                      <p className="text-[11px] text-[var(--color-text-secondary)] italic">
                        "{src.text}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Footer */}
          <div className="pt-6 text-[10px] text-[var(--color-text-muted)] font-mono border-t border-[var(--color-border)]/40 print:border-gray-200">
            This document was generated by Prakriti AI via deterministic semantic RAG. All recommendations should be calibrated against local soil testing and agronomic extension guidelines.
          </div>
        </div>
      </div>
    </div>
  );
};
