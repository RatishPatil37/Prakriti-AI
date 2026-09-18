import React, { useState } from 'react';
import { 
  Leaf, 
  UploadCloud, 
  Sliders, 
  Plus, 
  ShieldCheck, 
  Database, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  User,
  Users
} from 'lucide-react';
import { ChatPanel } from '../chat/ChatPanel';
import { EvidenceRail } from '../evidence/EvidenceRail';
import { EnvironmentalContextModal } from '../chat/EnvironmentalContextModal';
import { DocumentManager } from '../uploads/DocumentManager';
import { EnvironmentalContextData } from '../../lib/sse';

interface Props {
  messages: any[];
  onSendMessage: (text: string) => void;
  onCancelStream: () => void;
  isStreaming: boolean;
  streamingStage: string | null;
  environmentalContext: EnvironmentalContextData;
  onUpdateContext: (ctx: EnvironmentalContextData) => void;
  evidenceList: any[];
  qualityAssessment: any;
  metrics: any;
  citationsVerified: boolean | null;
  clarificationData: any;
  onResetChat: () => void;
  currentUser: { user_id: string; email: string } | null;
  onSwitchUser: (persona: 'user_a' | 'user_b' | 'anon') => void;
  authToken: string | null;
}

export const Shell: React.FC<Props> = ({
  messages,
  onSendMessage,
  onCancelStream,
  isStreaming,
  streamingStage,
  environmentalContext,
  onUpdateContext,
  evidenceList,
  qualityAssessment,
  metrics,
  citationsVerified,
  clarificationData,
  onResetChat,
  currentUser,
  onSwitchUser,
  authToken
}) => {
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  const activePersona = !currentUser 
    ? 'anon' 
    : currentUser.email.includes('user_a') 
      ? 'user_a' 
      : 'user_b';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#040D09] text-slate-200 font-sans relative selection:bg-emerald-500/30 selection:text-[#A9EE70]">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[#A9EE70]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Left Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-emerald-500/10 bg-[#07130E]/90 backdrop-blur-2xl flex flex-col justify-between z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-emerald-500/10">
            {/* Mac OS Console Dots */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/80 inline-block shadow-[0_0_6px_rgba(255,95,87,0.5)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/80 inline-block shadow-[0_0_6px_rgba(254,188,46,0.5)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/80 inline-block shadow-[0_0_6px_rgba(40,200,64,0.5)]" />
              <span className="ml-auto text-[10px] font-mono text-emerald-400/60 uppercase tracking-[0.2em]">
                SYS.V2.4
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#007B3A] p-[1px] shadow-[0_0_20px_rgba(0,146,69,0.35)]">
                <div className="w-full h-full bg-[#07130E] rounded-[11px] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#A9EE70] animate-pulse-slow" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-white">Darukaa<span className="text-[#A9EE70]">.Earth</span></h1>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#A9EE70]/15 text-[#A9EE70] border border-[#A9EE70]/30">
                    AI
                  </span>
                </div>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.18em]">
                  Nature Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          {/* New Consultation CTA Button */}
          <div className="p-4">
            <button
              type="button"
              onClick={onResetChat}
              className="w-full group relative overflow-hidden flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-[#009245] to-[#10B981] hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold shadow-[0_4px_20px_rgba(0,146,69,0.35)] transition-all duration-300 hover:shadow-[0_4px_25px_rgba(169,238,112,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Plus className="w-4 h-4 text-[#A9EE70]" />
              <span className="tracking-wide">New Ecological Consultation</span>
            </button>
          </div>

          {/* Navigation Action Items */}
          <div className="px-3 space-y-1.5">
            <button
              type="button"
              onClick={() => setDocumentModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/10 hover:border-emerald-500/30 transition duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-[#A9EE70] group-hover:bg-[#A9EE70]/10 transition">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Private Document Vault</div>
                  <div className="text-[10px] text-slate-400 font-mono">Isolated tenant indexing</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#A9EE70] group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => setContextModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/10 hover:border-emerald-500/30 transition duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-[#A9EE70] group-hover:bg-[#A9EE70]/10 transition">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Environmental Context</div>
                  <div className="text-[10px] text-slate-400 font-mono">Soil, climate & land use</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#A9EE70] group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          {/* Multi-Tenant Vault Tester Switcher */}
          <div className="p-4 mx-3 mt-4 rounded-xl bg-gradient-to-b from-[#0B1F16]/80 to-[#07130E]/90 border border-emerald-500/15 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#A9EE70]" />
                <span>Tenant Isolation Demo</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A9EE70] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A9EE70]"></span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/40 border border-emerald-500/10 text-[11px] font-medium font-mono">
              <button
                type="button"
                onClick={() => onSwitchUser('anon')}
                className={`py-1.5 px-2 rounded-md transition-all text-center ${
                  activePersona === 'anon'
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(0,146,69,0.5)] font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => onSwitchUser('user_a')}
                className={`py-1.5 px-2 rounded-md transition-all text-center ${
                  activePersona === 'user_a'
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(0,146,69,0.5)] font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                User A
              </button>
              <button
                type="button"
                onClick={() => onSwitchUser('user_b')}
                className={`py-1.5 px-2 rounded-md transition-all text-center ${
                  activePersona === 'user_b'
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(0,146,69,0.5)] font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                User B
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              {activePersona === 'anon' ? (
                <span>Public mode grounds in verified IPCC, IPBES & IUCN knowledge base.</span>
              ) : (
                <span>Private PDF vault isolated to <strong className="text-emerald-300 font-mono">{activePersona === 'user_a' ? 'User A' : 'User B'}</strong>. Zero cross-tenant leakage.</span>
              )}
            </p>
          </div>
        </div>

        {/* Bottom System Telemetry HUD */}
        <div className="p-4 border-t border-emerald-500/10 bg-[#040D09]/80">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                Qdrant Cloud
              </span>
              <span className="text-[#A9EE70] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A9EE70] animate-pulse" />
                1,143 pts
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-emerald-400" />
                Engine
              </span>
              <span className="text-slate-300 font-medium">FastEmbed Hybrid</span>
            </div>

            <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px] text-slate-500">
              <span>darukaa.earth inspired</span>
              <a 
                href="https://darukaa.earth" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-[#A9EE70] flex items-center gap-1 transition"
              >
                Darukaa <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Center Chat Panel */}
      <ChatPanel
        messages={messages}
        onSendMessage={onSendMessage}
        onCancelStream={onCancelStream}
        isStreaming={isStreaming}
        streamingStage={streamingStage}
        environmentalContext={environmentalContext}
        onOpenContextModal={() => setContextModalOpen(true)}
        clarificationData={clarificationData}
        onAnswerClarification={onSendMessage}
      />

      {/* Right Evidence Rail */}
      <EvidenceRail
        evidenceList={evidenceList}
        qualityAssessment={qualityAssessment}
        metrics={metrics}
        citationsVerified={citationsVerified}
      />

      {/* Modals */}
      <EnvironmentalContextModal
        isOpen={contextModalOpen}
        onClose={() => setContextModalOpen(false)}
        context={environmentalContext}
        onSave={onUpdateContext}
      />

      <DocumentManager
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        authToken={authToken}
      />
    </div>
  );
};
