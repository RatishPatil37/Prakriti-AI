import React, { useState } from 'react';
import { 
  Leaf, 
  UploadCloud, 
  UserCheck, 
  Plus, 
  Globe2
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-botanical font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-earth-border bg-white flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-earth-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center shadow-md">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-serif font-bold text-evergreen tracking-tight">Darukaa.Earth</h1>
              <p className="text-[10px] font-mono text-forest-600 uppercase tracking-wider">AI Environmental Scientist</p>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              type="button"
              onClick={onResetChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Ecological Consultation</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-2 space-y-1">
            <button
              type="button"
              onClick={() => setDocumentModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-evergreen/80 hover:bg-earth-100 transition text-left"
            >
              <UploadCloud className="w-4 h-4 text-forest-600" />
              <span>Private Document Vault</span>
            </button>

            <button
              type="button"
              onClick={() => setContextModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-evergreen/80 hover:bg-earth-100 transition text-left"
            >
              <Globe2 className="w-4 h-4 text-forest-600" />
              <span>Environmental Context</span>
            </button>
          </div>

          {/* Persona Demo Switcher */}
          <div className="p-3 mx-3 mt-4 rounded-xl bg-botanical-100 border border-earth-border space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-evergreen/60 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-forest-600" />
              <span>Tenant Testing Switcher</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => onSwitchUser('user_a')}
                className={`px-2 py-1 rounded-lg border text-center transition ${currentUser?.email === 'user_a@darukaa.test' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white border-earth-border text-evergreen hover:bg-earth-100'}`}
              >
                User A
              </button>
              <button
                type="button"
                onClick={() => onSwitchUser('user_b')}
                className={`px-2 py-1 rounded-lg border text-center transition ${currentUser?.email === 'user_b@darukaa.test' ? 'bg-forest-600 text-white border-forest-600' : 'bg-white border-earth-border text-evergreen hover:bg-earth-100'}`}
              >
                User B
              </button>
            </div>
            <p className="text-[10px] text-evergreen/50 leading-tight">
              Test isolation: Private documents uploaded by User A will be invisible to User B.
            </p>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-earth-border bg-botanical-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-forest-600/10 text-forest-600 flex items-center justify-center text-xs font-bold font-mono">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-evergreen truncate">
                {currentUser?.email || 'Anonymous Public Demo'}
              </div>
              <div className="text-[10px] text-evergreen/50 font-mono truncate">
                {currentUser?.user_id ? `ID: ${currentUser.user_id.slice(0, 8)}...` : 'Public Scope Only'}
              </div>
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
