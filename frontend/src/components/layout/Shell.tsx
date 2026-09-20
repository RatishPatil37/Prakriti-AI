import React, { useState, useRef } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { ConversationSidebar } from './ConversationSidebar';
import { EvidencePanel } from '../evidence/EvidencePanel';
import { EnvironmentalContextModal } from '../chat/EnvironmentalContextModal';
import { DocumentManager } from '../uploads/DocumentManager';
import { EnvironmentalContextData } from '../../lib/sse';
import { Conversation } from '../../lib/conversations';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu, BookOpen, RefreshCw, Sun, Moon,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

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
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem('prakriti_sidebar_open') !== 'false';
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('prakriti_sidebar_width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const isDraggingRef = useRef(false);

  const toggleDesktopSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('prakriti_sidebar_open', String(next));
      return next;
    });
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.min(460, Math.max(220, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setSidebarWidth(current => {
          localStorage.setItem('prakriti_sidebar_width', String(current));
          return current;
        });
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const STAGE_LABELS: Record<string, string> = {
    auth: 'Connecting…',
    thinking: 'Reading query…',
    retrieval: 'Searching corpus…',
    generation: 'Generating…',
    default: 'Working…',
  };
  const stageLabel = streamingStage ? (STAGE_LABELS[streamingStage] ?? STAGE_LABELS.default) : '';

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
        onPinToggle={onPinToggle}
        onOpenDocuments={() => setDocumentModalOpen(true)}
        onOpenContextModal={() => setContextModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        isOpen={sidebarOpen}
        width={sidebarWidth}
        onResizeMouseDown={handleMouseDownResize}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar — unified, responsive header */}
        <div className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-4 gap-3 flex-shrink-0 justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Desktop sidebar toggle button */}
            <button
              onClick={toggleDesktopSidebar}
              className="hidden md:flex p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-[var(--color-accent-light)]" />
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Conversation title */}
            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-sm">
              {activeConversation?.title || 'Prakriti'}
            </span>

            {/* Streaming stage pill */}
            {isStreaming && streamingStage && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-mono">
                <RefreshCw className="w-3 h-3 animate-spin text-[var(--color-accent-light)]" />
                <span>{stageLabel}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* Sources panel toggle */}
            <button
              onClick={() => setSourcesOpen(v => !v)}
              title={sourcesOpen ? 'Hide sources' : 'Show sources'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                sourcesOpen
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-accent-light)] border-[var(--color-border-hover)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[var(--color-accent-light)]" />
              <span className="hidden sm:inline">Sources</span>
              {evidenceList.length > 0 && (
                <span className="bg-[var(--color-accent-subtle)] text-[var(--color-accent-light)] px-1.5 py-0.5 rounded-full text-[10px] font-semibold font-mono">
                  {evidenceList.length}
                </span>
              )}
            </button>
          </div>
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
            onOpenSources={() => setSourcesOpen(true)}
          />

          {/* Evidence panel — shown when toggled open */}
          {sourcesOpen && (
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
