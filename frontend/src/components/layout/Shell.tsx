import React, { useState, useRef, useEffect } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { ConversationSidebar } from './ConversationSidebar';
import { EvidencePanel } from '../evidence/EvidencePanel';
import { EnvironmentalContextModal } from '../chat/EnvironmentalContextModal';
import { DocumentManager } from '../uploads/DocumentManager';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { CommandPalette } from '../common/CommandPalette';
import { DossierExportModal } from '../chat/DossierExportModal';
import { EnvironmentalContextData } from '../../lib/sse';
import { Conversation } from '../../lib/conversations';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu, BookOpen, RefreshCw, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, Search, MapPin
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
  const [tourOpen, setTourOpen] = useState(() => {
    return localStorage.getItem('prakriti_tour_completed') !== 'true';
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [dossierMessage, setDossierMessage] = useState<any | null>(null);
  const [activeInspectSources, setActiveInspectSources] = useState<any[] | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    setActiveInspectSources(null);
  }, [activeConversationId]);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem('prakriti_sidebar_open') !== 'false';
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('prakriti_sidebar_width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleApplyPreset = (preset: 'semi_arid_wheat' | 'degraded_pasture') => {
    if (preset === 'semi_arid_wheat') {
      onUpdateContext({
        region_or_coords: 'Western India / Semi-Arid Plateau',
        climate_zone: 'Semi-Arid',
        soil_organic_carbon_pct: 0.3,
        soil_ph: 7.8,
        annual_rainfall_mm: 350,
        current_land_use: 'Monoculture wheat with intensive tillage',
        crop_or_vegetation: 'Wheat (Triticum aestivum)',
        water_availability: 'Rainfed with seasonal deficit',
        target_goals: ['Restore soil carbon', 'Enhance pollinator diversity', 'Mitigate erosion']
      });
    } else {
      onUpdateContext({
        region_or_coords: 'Deccan Dry Zone',
        climate_zone: 'Sub-tropical Dry',
        soil_organic_carbon_pct: 0.45,
        soil_ph: 6.5,
        annual_rainfall_mm: 550,
        current_land_use: 'Continuous cattle grazing',
        crop_or_vegetation: 'Degraded native scrub & invasive weeds',
        water_availability: 'Ephemeral surface runoff',
        target_goals: ['Silvopasture integration', 'Deep root soil aggregation']
      });
    }
  };

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
        onStartTour={() => setTourOpen(true)}
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
            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-sm font-sans">
              {activeConversation?.title || 'Prakriti'}
            </span>

            {/* Living Site Profile HUD */}
            <button
              id="tour-context-btn"
              onClick={() => setContextModalOpen(true)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition cursor-pointer border shrink-0 ${
                environmentalContext.region_or_coords || environmentalContext.climate_zone
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
              title="Calibrate local site parameters"
            >
              <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="truncate max-w-[220px]">
                {environmentalContext.region_or_coords || environmentalContext.climate_zone || '+ Calibrate site'}
                {environmentalContext.soil_organic_carbon_pct ? ` · SOC ${environmentalContext.soil_organic_carbon_pct}%` : ''}
              </span>
            </button>

            {/* Streaming stage pill */}
            {isStreaming && streamingStage && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-mono shrink-0">
                <RefreshCw className="w-3 h-3 animate-spin text-[var(--color-accent-light)]" />
                <span>{stageLabel}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] transition cursor-pointer shrink-0"
              title="Command Palette (Cmd+K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="font-sans">Command</span>
              <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                ⌘K
              </kbd>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] transition cursor-pointer shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* Sources panel toggle */}
            <button
              id="tour-sources-btn"
              onClick={() => {
                setActiveInspectSources(null);
                setSourcesOpen(v => !v);
              }}
              title={sourcesOpen ? 'Hide sources' : 'Show sources'}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border shrink-0 whitespace-nowrap ${
                sourcesOpen
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-accent-light)] border-[var(--color-border-hover)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[var(--color-accent-light)] shrink-0" />
              <span className="hidden sm:inline">Sources</span>
              {(activeInspectSources || evidenceList).length > 0 && (
                <span className="bg-[var(--color-accent-subtle)] text-[var(--color-accent-light)] px-1.5 py-0.5 rounded-full text-[10px] font-semibold font-mono">
                  {(activeInspectSources || evidenceList).length}
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
            onOpenSources={(specificSources) => {
              if (specificSources && specificSources.length > 0) {
                setActiveInspectSources(specificSources);
              }
              setSourcesOpen(true);
            }}
            onExportDossier={(msg) => setDossierMessage(msg)}
          />

          {/* Evidence panel — shown when toggled open */}
          {sourcesOpen && (
            <EvidencePanel
              evidenceList={activeInspectSources || evidenceList}
              qualityAssessment={qualityAssessment}
              citationsVerified={citationsVerified}
              onClose={() => {
                setSourcesOpen(false);
                setActiveInspectSources(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Modals & Tools */}
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

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewSession={onNewConversation}
        onOpenContext={() => setContextModalOpen(true)}
        onOpenDocuments={() => setDocumentModalOpen(true)}
        onToggleSources={() => setSourcesOpen(v => !v)}
        onStartTour={() => setTourOpen(true)}
        onApplyPreset={handleApplyPreset}
      />

      {/* Dossier Export Modal */}
      <DossierExportModal
        isOpen={!!dossierMessage}
        onClose={() => setDossierMessage(null)}
        messageContent={dossierMessage?.content || ''}
        sources={dossierMessage?.sources || []}
        quality={dossierMessage?.quality}
        environmentalContext={environmentalContext}
        conversationTitle={activeConversation?.title}
      />
    </div>
  );
};
