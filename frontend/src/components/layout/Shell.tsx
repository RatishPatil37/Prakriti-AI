import React, { useState } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { ConversationSidebar } from './ConversationSidebar';
import { EvidencePanel } from '../evidence/EvidencePanel';
import { EnvironmentalContextModal } from '../chat/EnvironmentalContextModal';
import { DocumentManager } from '../uploads/DocumentManager';
import { EnvironmentalContextData } from '../../lib/sse';
import { Conversation } from '../../lib/conversations';
import { Menu } from 'lucide-react';

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
}) => {
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        onOpenDocuments={() => setDocumentModalOpen(true)}
        onOpenContextModal={() => setContextModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile header bar */}
        <div className="md:hidden h-12 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate flex-1">
            {activeConversation?.title || 'Prakriti AI'}
          </span>
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

          {/* Evidence panel — only shown when there are sources */}
          {evidenceList.length > 0 && (
            <EvidencePanel
              evidenceList={evidenceList}
              qualityAssessment={qualityAssessment}
              citationsVerified={citationsVerified}
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
