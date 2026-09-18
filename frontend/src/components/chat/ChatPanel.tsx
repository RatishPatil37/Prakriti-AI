import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sliders, RefreshCw, XCircle, AlertCircle, Bot, User, Sparkles } from 'lucide-react';
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
  }, [messages, streamingStage]);

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
    <div className="flex-1 flex flex-col h-full bg-botanical relative overflow-hidden">
      {/* Top Status Bar */}
      <div className="h-14 border-b border-earth-border px-6 flex items-center justify-between bg-white/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-pulse" />
          <span className="text-sm font-serif font-semibold text-evergreen">AI Environmental Scientist</span>
          {streamingStage && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-limeaccent/15 text-evergreen border border-limeaccent/30 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-forest-600" />
              Stage: {streamingStage}
            </span>
          )}
        </div>

        {/* Environmental Context Pill */}
        <button
          type="button"
          onClick={onOpenContextModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-earth-100 hover:bg-earth-200 text-evergreen border border-earth-border transition"
        >
          <Sliders className="w-3.5 h-3.5 text-forest-600" />
          <span>Site Context:</span>
          <span className="font-mono text-forest-600 font-bold">
            {environmentalContext.soil_organic_carbon_pct !== undefined
              ? `SOC ${environmentalContext.soil_organic_carbon_pct}%`
              : 'Configure'}
          </span>
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto my-12 text-center space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-forest-600/10 text-forest-600 border border-forest-600/20">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-evergreen">
                Reasoning with Scientific Evidence
              </h2>
              <p className="text-sm text-evergreen/70 max-w-lg mx-auto leading-relaxed">
                Ask about ecological interventions, soil carbon dynamics, biodiversity indices, and microclimate regimes. Recommendations are grounded in IPCC, FAO, IUCN, and GBIF evidence.
              </p>
            </div>

            {/* Quick Benchmark Prompts */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <button
                type="button"
                onClick={() => handleQuickPrompt("My wheat field in a semi-arid region has declining biodiversity. SOC is 0.3%, annual rainfall is around 350 mm, and I use intensive tillage. What should I change first and why?")}
                className="p-3.5 rounded-xl bg-white border border-earth-border hover:border-forest-600/50 text-left transition shadow-sm group"
              >
                <div className="text-xs font-semibold text-forest-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Hackathon Core Scenario
                </div>
                <div className="text-xs text-evergreen/80 mt-1 line-clamp-2">
                  Semi-arid wheat field: SOC 0.3%, 350mm rainfall, intensive tillage. What to change first?
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt("Biodiversity is declining on my land.")}
                className="p-3.5 rounded-xl bg-white border border-earth-border hover:border-forest-600/50 text-left transition shadow-sm group"
              >
                <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Clarification Trigger
                </div>
                <div className="text-xs text-evergreen/80 mt-1 line-clamp-2">
                  "Biodiversity is declining on my land" (Tests Zero-LLM Fast Clarification)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt("What is soil organic carbon?")}
                className="p-3.5 rounded-xl bg-white border border-earth-border hover:border-forest-600/50 text-left transition shadow-sm group sm:col-span-2"
              >
                <div className="text-xs font-semibold text-evergreen/70">
                  Direct Conceptual Query
                </div>
                <div className="text-xs text-evergreen/80 mt-1">
                  "What is soil organic carbon?" (Validates unforced single-variable explanation)
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-forest-600 text-white shadow-sm max-w-xl'
                    : 'bg-white border border-earth-border shadow-sm text-evergreen max-w-2xl'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className={`prose prose-sm prose-evergreen max-w-none ${msg.isStreaming ? 'typing-cursor' : ''}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-earth-200 text-evergreen flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Zero-LLM Clarification Card */}
        {clarificationData && (
          <div className="max-w-2xl mr-auto p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Context Clarification Required</span>
            </div>
            <p className="text-xs text-amber-900/80">
              To provide an accurate, multi-variable scientific intervention rather than generic advice, please specify your site conditions:
            </p>
            <div className="space-y-1.5 text-xs font-medium">
              {clarificationData.suggested_questions?.map((q: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-amber-200/50">
                  <span className="text-amber-700 font-mono font-bold">0{idx + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={onOpenContextModal}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-sm transition"
              >
                Fill Environmental Parameters
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-earth-border bg-white/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask the AI Environmental Scientist about interventions, multi-metric dynamics, or soil carbon..."
            rows={2}
            className="w-full px-4 py-3 text-sm bg-botanical-50 border border-earth-border rounded-xl focus:outline-none focus:ring-1 focus:ring-forest-600 resize-none pr-24 shadow-inner"
          />

          <div className="absolute right-3 bottom-3.5 flex items-center gap-2">
            <span className="text-[10px] font-mono text-evergreen/40">
              {inputText.length}/1000
            </span>

            {isStreaming ? (
              <button
                type="button"
                onClick={onCancelStream}
                className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition shadow-sm"
                title="Cancel upstream generation"
              >
                <XCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-lg bg-forest-600 hover:bg-forest-500 text-white disabled:opacity-40 disabled:hover:bg-forest-600 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
