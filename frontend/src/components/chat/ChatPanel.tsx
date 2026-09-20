import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send, XCircle, AlertCircle, Leaf, User,
  ArrowRight, BookOpen, ChevronDown, ExternalLink, ArrowDown
} from 'lucide-react';
import { EnvironmentalContextData } from '../../lib/sse';
import { TypewriterStatus } from './TypewriterStatus';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  sources?: any[];
  quality?: any;
}

interface Props {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onCancelStream: () => void;
  isStreaming: boolean;
  streamingStage: string | null;
  environmentalContext: EnvironmentalContextData;
  onOpenContextModal: () => void;
  clarificationData: any;
  onAnswerClarification: (answers: string) => void;
  conversationTitle?: string | null;
  onOpenSources?: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    label: 'Soil carbon & biodiversity',
    text: 'My wheat field in a semi-arid region has declining biodiversity. SOC is 0.3%, annual rainfall is around 350mm, and I use intensive tillage. What should I change first?',
  },
  {
    label: 'Moisture retention & cover crops',
    text: 'How can cover cropping and reduced tillage enhance volumetric soil moisture and microbial biomass in degraded dryland soils?',
  },
  {
    label: 'Pollinator & habitat restoration',
    text: 'What agroforestry species and native flowering buffers best restore pollinator populations and species richness on degraded farmland?',
  },
  {
    label: 'pH, mycorrhizae & nutrient cycling',
    text: 'What is the relationship between alkaline soil pH (7.8), mycorrhizal fungal networks, and organic matter decomposition?',
  },
];

export const ChatPanel: React.FC<Props> = ({
  messages,
  onSendMessage,
  onCancelStream,
  isStreaming,
  streamingStage,
  environmentalContext,
  onOpenContextModal,
  clarificationData,
  onAnswerClarification,
  conversationTitle,
  onOpenSources,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    const el = scrollViewportRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 140);
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, clarificationData]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleSourceAccordion = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

const isRefusal = (text?: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('only equipped to assist with ecological') ||
    lower.includes('outside my scope') ||
    lower.includes('not equipped to answer') ||
    lower.includes('environmental sciences')
  );
};

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)] overflow-hidden relative">
      {/* Messages Viewport */}
      <div
        ref={scrollViewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
      >
        {messages.length === 0 && !clarificationData ? (
          // Welcome Hero State
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-10 animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                Prakriti
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
                Research assistant for soil, biodiversity, water, land degradation, restoration,
                agriculture, and climate — grounded in peer-reviewed literature.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-center">
                Research prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputText(p.text)}
                    className="text-left px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-2)] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition">
                        {p.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-light)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Message Thread List
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
            {messages.map((msg) => {
              // Preprocess markdown content to make [S1], [S2] tags interactive markdown links
              const processedContent = msg.content
                ? msg.content.replace(/\[(S\d+)\]/g, '[$1](#cite-$1)')
                : '';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 animate-fadeIn ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Leaf className="w-4 h-4 text-[var(--color-accent-light)]" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl text-sm leading-relaxed max-w-[88%] ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-4 py-3 shadow-sm'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] p-5 flex-1 shadow-sm'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Markdown Body */}
                        <div className={`prose-chat ${msg.isStreaming ? 'typing-cursor' : ''}`}>
                          {processedContent ? (
                            <ReactMarkdown
                              components={{
                                a: ({ children, href }) => {
                                  if (href?.startsWith('#cite-')) {
                                    const citeId = href.replace('#cite-', '');
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          toggleSourceAccordion(msg.id);
                                          onOpenSources?.();
                                        }}
                                        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer transition-all shadow-sm align-baseline"
                                        title={`View scientific evidence [${citeId}]`}
                                      >
                                        [{children}]
                                      </button>
                                    );
                                  }
                                  return (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--color-accent-light)] hover:underline"
                                    >
                                      {children}
                                    </a>
                                  );
                                },
                              }}
                            >
                              {processedContent}
                            </ReactMarkdown>
                          ) : msg.isStreaming ? (
                            <TypewriterStatus stage={streamingStage} />
                          ) : null}
                        </div>

                        {/* Grounding Sources Accordion (Perplexity / Gemini Style) */}
                        {!isRefusal(msg.content) && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-[var(--color-border)]">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleSourceAccordion(msg.id)}
                                className="flex items-center gap-2 text-xs font-mono font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)] transition cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent-light)]" />
                                <span>Evidence ({msg.sources.length})</span>
                                {msg.quality && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                                      msg.quality.status === 'Strong'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : msg.quality.status === 'Moderate'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {msg.quality.status} Evidence
                                  </span>
                                )}
                                <ChevronDown
                                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                    expandedSources[msg.id] ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {onOpenSources && (
                                <button
                                  type="button"
                                  onClick={onOpenSources}
                                  className="text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition"
                                >
                                  View in Rail →
                                </button>
                              )}
                            </div>

                            {expandedSources[msg.id] && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fadeIn">
                                {msg.sources.map((src: any) => (
                                  <div
                                    key={src.id}
                                    className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-emerald-500/30 transition shadow-sm space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        [{src.id}]
                                      </span>
                                      <span className="text-[10px] font-mono text-[var(--color-text-muted)] font-semibold truncate">
                                        {src.organization || 'Scientific Corpus'}
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">
                                      {src.title}
                                    </p>
                                    {src.text && (
                                      <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 italic leading-relaxed">
                                        "{src.text}"
                                      </p>
                                    )}
                                    {src.doi && (
                                      <a
                                        href={src.source_url || `https://doi.org/${src.doi}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:underline pt-0.5"
                                      >
                                        DOI: {src.doi} <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Clarification card */}
            {clarificationData && (
              <div className="animate-fadeIn bg-[var(--color-surface)] border border-amber-500/25 rounded-2xl p-5 space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  A bit more detail would help
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {clarificationData.message || 'To provide a precise, site-specific recommendation, please share a bit more about your local conditions:'}
                </p>
                <div className="space-y-1.5">
                  {clarificationData.suggested_questions?.map((q: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm bg-[var(--color-surface-2)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                      <span className="text-[var(--color-accent-light)] font-medium flex-shrink-0">{idx + 1}.</span>
                      <span className="text-[var(--color-text-secondary)]">{q}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={onOpenContextModal}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Set site parameters
                  </button>
                  <button
                    onClick={() => onAnswerClarification('My field is semi-arid wheat with SOC 0.3%, 350mm annual rainfall, and intensive tillage.')}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    Use example conditions
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Arrow Button (ChatGPT style) */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
          className="absolute bottom-28 right-6 md:right-10 z-30 p-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-light)] shadow-xl transition-all duration-200 cursor-pointer animate-fadeIn flex items-center justify-center hover:scale-105 active:scale-95"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4 text-[var(--color-accent-light)]" />
        </button>
      )}

      {/* Floating Input Dock */}
      <div className="p-4 md:p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] focus-within:border-[var(--color-accent-light)] rounded-2xl transition-all">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about soil health, carbon, biodiversity, moisture, agroforestry..."
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent px-4 py-3.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none resize-none min-h-[48px] max-h-[160px]"
              />

              <div className="flex items-center gap-1.5 pr-3">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onCancelStream}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Cancel stream"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-30 text-white transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                    title="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Micro Footer Status */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono px-1">
            <span>Grounded in IPCC, IPBES & IUCN peer-reviewed literature</span>
            <span>Prakriti AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatPanel;
