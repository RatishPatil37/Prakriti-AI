import React, { useState, useEffect } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { ConversationSidebar } from './ConversationSidebar';
import { EvidencePanel } from '../evidence/EvidencePanel';
import { EnvironmentalContextModal } from '../chat/EnvironmentalContextModal';
import { DocumentManager } from '../uploads/DocumentManager';
import { EnvironmentalContextData } from '../../lib/sse';
import { Conversation } from '../../lib/conversations';
import { Menu, BookOpen } from 'lucide-react';

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
  citationsVerified: boolean | null;
  clarificationData: any;
  onResetChat: () => void;
  authToken: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinToggle: (id: string, currentPinned: boolean) => void;
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
  citationsVerified,
  clarificationData,
  onResetChat,
  authToken,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinToggle,
}) => {
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Sources panel: auto-open when new evidence arrives, user can close manually
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Auto-open sources panel when evidence arrives for the first time in a response
  useEffect(() => {
    if (evidenceList.length > 0) {
      setSourcesOpen(true);
    }
  }, [evidenceList.length]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        onPinToggle={onPinToggle}
        onOpenDocuments={() => setDocumentModalOpen(true)}
        onOpenContextModal={() => setContextModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar — desktop shows title + BookOpen toggle; mobile shows menu + title */}
        <div className="h-12 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-4 gap-3 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Conversation title */}
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate flex-1">
            {activeConversation?.title || 'Prakriti AI'}
          </span>

          {/* BookOpen button — toggle Sources panel; shows badge with count */}
          {evidenceList.length > 0 && (
            <button
              onClick={() => setSourcesOpen(v => !v)}
              title={sourcesOpen ? 'Hide sources' : 'Show sources'}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                sourcesOpen
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-accent-light)] border border-[var(--color-border)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Sources</span>
              <span className="bg-[var(--color-accent)]/20 text-[var(--color-accent-light)] px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                {evidenceList.length}
              </span>
            </button>
          )}
        </div>

        {/* Chat + Evidence layout */}
        <div className="flex-1 flex overflow-hidden">
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
            conversationTitle={activeConversation?.title ?? null}
          />

          {/* Evidence panel — only shown when there are sources AND user hasn't closed it */}
          {evidenceList.length > 0 && sourcesOpen && (
            <EvidencePanel
              evidenceList={evidenceList}
              qualityAssessment={qualityAssessment}
              citationsVerified={citationsVerified}
              onClose={() => setSourcesOpen(false)}
            />
          )}
        </div>
      </div>

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
