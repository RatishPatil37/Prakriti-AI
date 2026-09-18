import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send, XCircle, AlertCircle, Leaf, User,
  ArrowRight, RefreshCw
} from 'lucide-react';
import { EnvironmentalContextData } from '../../lib/sse';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
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
}

const EXAMPLE_PROMPTS = [
  {
    label: 'Soil restoration',
    text: 'My wheat field in a semi-arid region has declining biodiversity. SOC is 0.3%, annual rainfall is around 350mm, and I use intensive tillage. What should I change first?',
  },
  {
    label: 'Carbon sequestration',
    text: 'What is soil organic carbon and how does continuous intensive tillage deplete it over time?',
  },
  {
    label: 'Biodiversity recovery',
    text: 'How do I restore native pollinator populations on degraded agricultural land?',
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
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const hasContext = environmentalContext.region_or_coords || environmentalContext.climate_zone;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)] overflow-hidden">
      {/* Top bar */}
      <div className="h-14 border-b border-[var(--color-border)] px-4 md:px-6 flex items-center justify-between bg-[var(--color-surface)] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {conversationTitle && (
            <h2 className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-xs">
              {conversationTitle}
            </h2>
          )}
          {isStreaming && streamingStage && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <RefreshCw className="w-3 h-3 animate-spin text-[var(--color-accent-light)]" />
              <span>Thinking…</span>
            </div>
          )}
        </div>

        {/* Context badge */}
        <button
          onClick={onOpenContextModal}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
          title="Configure your site context for more accurate answers"
        >
          <Leaf className="w-3 h-3 text-[var(--color-accent-light)]" />
          <span className="hidden sm:inline">
            {hasContext ? environmentalContext.region_or_coords?.split('/')[0]?.trim() || 'Site context' : 'Set site context'}
          </span>
          <span className="sm:hidden">Context</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !clarificationData ? (
          // Welcome state
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 space-y-10 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto">
                <Leaf className="w-6 h-6 text-[var(--color-accent-light)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                What would you like to know?
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                Ask about soil health, biodiversity, carbon, water management, or sustainable farming — grounded in peer-reviewed science.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Example questions
              </p>
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(p.text)}
                  className="w-full text-left p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)] transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-accent-light)] mb-1">
                        {p.label}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition line-clamp-2">
                        {p.text}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-light)] group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Message list
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fadeIn ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Leaf className="w-3.5 h-3.5 text-[var(--color-accent-light)]" />
                  </div>
                )}

                <div
                  className={`rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-4 py-3'
                      : 'text-[var(--color-text-primary)] flex-1'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className={`prose-chat ${msg.isStreaming ? 'typing-cursor' : ''}`}>
                      {msg.content ? (
                        <ReactMarkdown
                          components={{
                            a: ({ children, href }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer"
                                className="text-[var(--color-accent-light)] hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : msg.isStreaming ? (
                        <span className="text-[var(--color-text-muted)] text-sm">Thinking…</span>
                      ) : null}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>
            ))}

            {/* Clarification card */}
            {clarificationData && (
              <div className="animate-fadeIn bg-[var(--color-surface)] border border-amber-500/25 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  A bit more detail would help
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {clarificationData.message || 'To give you a precise, site-specific recommendation, please share a bit more about your conditions:'}
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

      {/* Input dock */}
      <div className="flex-shrink-0 p-3 md:p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className={`relative flex items-end gap-2 p-2 rounded-2xl bg-[var(--color-bg)] border transition-all ${
            isStreaming ? 'border-[var(--color-border)]' : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]/20'
          }`}>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about soil, biodiversity, carbon, water management…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none resize-none px-2 py-1.5 max-h-40"
              style={{ minHeight: '36px' }}
            />

            <div className="flex items-center gap-1.5 flex-shrink-0 pb-1">
              <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline">
                {inputText.length > 800 ? `${inputText.length}/1000` : ''}
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onCancelStream}
                  title="Stop generating"
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 border border-rose-500/20 transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-2">
            Answers are grounded in peer-reviewed environmental science. Press Shift+Enter for a new line.
          </p>
        </form>
      </div>
    </div>
  );
};
