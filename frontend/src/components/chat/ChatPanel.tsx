import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Sliders, 
  RefreshCw, 
  XCircle, 
  AlertCircle, 
  Bot, 
  User, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle,
  Compass,
  CheckCircle2
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
}

export const ChatPanel: React.FC<Props> = ({
  messages,
  onSendMessage,
  onCancelStream,
  isStreaming,
  streamingStage,
  environmentalContext,
  onOpenContextModal,
  clarificationData,
  onAnswerClarification
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingStage, clarificationData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isStreaming) return;
    setInputText(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040D09] bg-grid-pattern relative overflow-hidden">
      {/* Top Atmospheric Radial Glow */}
      <div className="absolute top-0 inset-x-0 h-40 radial-glow-emerald pointer-events-none" />

      {/* Top Header Bar */}
      <div className="h-16 border-b border-emerald-500/10 px-6 flex items-center justify-between bg-[#07130E]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A9EE70] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#A9EE70]"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">AI Environmental Scientist</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Gemini 3.1 + RRF
              </span>
            </div>
          </div>

          {streamingStage && (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#A9EE70]/15 text-[#A9EE70] border border-[#A9EE70]/40 flex items-center gap-2 shadow-[0_0_15px_rgba(169,238,112,0.2)] animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-[#A9EE70]" />
              <span>Pipeline: {streamingStage}</span>
            </span>
          )}
        </div>

        {/* Environmental Context Badge */}
        <button
          type="button"
          onClick={onOpenContextModal}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#0B1F16] hover:bg-emerald-950 text-slate-200 border border-emerald-500/20 hover:border-[#A9EE70]/50 transition-all duration-300 shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-[#A9EE70] group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-slate-400">Context:</span>
          <span className="font-mono text-[#A9EE70] font-bold">
            {environmentalContext.soil_organic_carbon_pct !== undefined
              ? `SOC ${environmentalContext.soil_organic_carbon_pct}% • ${environmentalContext.annual_rainfall_mm || 350}mm`
              : 'Configure Site Context'}
          </span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto my-8 space-y-8 animate-fadeIn">
            {/* Hero Banner */}
            <div className="text-center space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1F16] border border-emerald-500/30 text-[11px] font-mono uppercase tracking-[0.2em] text-[#A9EE70] shadow-[0_0_20px_rgba(0,146,69,0.2)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A9EE70]" />
                <span>Ground Truth Nature Intelligence</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Ecological Complexity to <br />
                <span className="text-gradient-nature">Scientific Intelligence</span>
              </h2>

              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Query multi-variable ecological dynamics, soil organic carbon pathways, and biodiversity remediation. Grounded in peer-reviewed IPCC, IPBES, IUCN, and FAO global corpus.
              </p>
            </div>

            {/* Quick Benchmark Prompt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {/* Benchmark 1 */}
              <button
                type="button"
                onClick={() => handleQuickPrompt("My wheat field in a semi-arid region has declining biodiversity. SOC is 0.3%, annual rainfall is around 350 mm, and I use intensive tillage. What should I change first and why?")}
                className="group relative text-left p-4 rounded-2xl bg-gradient-to-b from-[#0B1F16]/90 to-[#07130E]/90 border border-emerald-500/20 hover:border-[#A9EE70]/50 hover:shadow-[0_0_25px_rgba(0,146,69,0.25)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#A9EE70] font-bold uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Hackathon Core
                    </span>
                    <span className="text-slate-500 group-hover:text-white transition">01</span>
                  </div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-[#A9EE70] transition leading-snug">
                    Semi-Arid Wheat Restoration
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    SOC 0.3%, 350mm rainfall, intensive tillage. Solves multi-metric trade-offs and first interventions.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-[#A9EE70] font-mono">
                  <span>Run Scenario</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Benchmark 2 */}
              <button
                type="button"
                onClick={() => handleQuickPrompt("Biodiversity is declining on my land.")}
                className="group relative text-left p-4 rounded-2xl bg-gradient-to-b from-[#161309]/90 to-[#0B0904]/90 border border-amber-500/25 hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Fast Clarification
                    </span>
                    <span className="text-slate-500 group-hover:text-white transition">02</span>
                  </div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-amber-300 transition leading-snug">
                    Zero-LLM Clarification Test
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    "Biodiversity is declining on my land." Tests instant sub-5ms clarification without generic advice.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-500/10 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-amber-300 font-mono">
                  <span>Test Clarification</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Benchmark 3 */}
              <button
                type="button"
                onClick={() => handleQuickPrompt("What is soil organic carbon and how does continuous intensive tillage deplete it?")}
                className="group relative text-left p-4 rounded-2xl bg-gradient-to-b from-[#0B1F16]/90 to-[#07130E]/90 border border-emerald-500/20 hover:border-[#A9EE70]/50 hover:shadow-[0_0_25px_rgba(0,146,69,0.25)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3 h-3" /> Foundational Query
                    </span>
                    <span className="text-slate-500 group-hover:text-white transition">03</span>
                  </div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition leading-snug">
                    Soil Organic Carbon Dynamics
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    Explains microbial aggregation, moisture retention, and tillage mechanics without forced extrapolation.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-cyan-300 font-mono">
                  <span>Ask Direct Concept</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-[#007B3A] p-[1px] flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(0,146,69,0.4)]">
                  <div className="w-full h-full bg-[#07130E] rounded-[11px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#A9EE70]" />
                  </div>
                </div>
              )}

              <div
                className={`rounded-2xl text-sm leading-relaxed p-5 transition-all duration-200 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-800/80 to-[#009245]/90 text-white shadow-[0_4px_25px_rgba(0,146,69,0.3)] max-w-2xl border border-emerald-400/30'
                    : 'glass-panel text-slate-200 max-w-3xl border border-emerald-500/20 shadow-2xl'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap font-sans font-medium">{msg.content}</p>
                ) : (
                  <div className={`prose-dark max-w-none ${msg.isStreaming ? 'typing-cursor' : ''}`}>
                    <ReactMarkdown
                      components={{
                        // Transform citations like [S1], [S2] into interactive badges
                        p: ({ node, children, ...props }) => <p {...props}>{children}</p>,
                        a: ({ node, children, href, ...props }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#A9EE70] hover:underline" {...props}>
                            {children}
                          </a>
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Zero-LLM Fast Clarification Card */}
        {clarificationData && (
          <div className="max-w-2xl mr-auto p-5 rounded-2xl bg-gradient-to-b from-[#1C1608]/95 to-[#0F0C04]/95 border border-amber-500/35 text-amber-100 space-y-3.5 shadow-[0_10px_35px_rgba(245,158,11,0.15)] animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Context Clarification Triggered (Zero-LLM Fast Filter)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                0 Tokens Burned
              </span>
            </div>

            <p className="text-xs text-amber-200/80 leading-relaxed">
              {clarificationData.message || 'To provide grounded, multi-variable scientific recommendations instead of generic advice, please specify your site conditions:'}
            </p>

            <div className="space-y-2">
              {clarificationData.suggested_questions?.map((q: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-amber-500/20 text-xs">
                  <span className="text-amber-400 font-mono font-bold">0{idx + 1}.</span>
                  <span className="text-amber-100/90">{q}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenContextModal}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition font-mono"
              >
                Configure Site Parameters
              </button>
              <button
                type="button"
                onClick={() => onAnswerClarification("My field is semi-arid wheat with SOC 0.3%, 350mm annual rainfall, and intensive tillage.")}
                className="px-3.5 py-2 text-xs font-medium bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 rounded-xl border border-amber-500/30 transition"
              >
                Use Hackathon Wheat Baseline
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Prompt Dock */}
      <div className="p-4 border-t border-emerald-500/10 bg-[#07130E]/90 backdrop-blur-2xl relative z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <div className="relative rounded-2xl bg-[#0B1A14]/90 border border-emerald-500/20 focus-within:border-[#A9EE70]/60 focus-within:shadow-[0_0_30px_rgba(169,238,112,0.15)] transition-all duration-300">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about ecological interventions, soil carbon dynamics, or microclimate regimes..."
              rows={2}
              className="w-full px-4 py-3.5 text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none pr-28 rounded-2xl font-sans"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-slate-500">
                {inputText.length}/1000
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onCancelStream}
                  className="p-2 rounded-xl bg-rose-950/60 text-rose-400 hover:bg-rose-900/80 border border-rose-500/30 transition shadow-sm"
                  title="Cancel upstream generation"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#10B981] hover:from-emerald-500 hover:to-[#A9EE70] text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_15px_rgba(0,146,69,0.4)] hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
