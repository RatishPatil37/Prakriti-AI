import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { Shell } from './components/layout/Shell';
import { streamEnvironmentalQuery, EnvironmentalContextData, ConversationTurnData } from './lib/sse';
import {
  Conversation,
  Message as DBMessage,
  listConversations,
  createConversation,
  deleteConversation,
  togglePinConversation,
  loadMessages,
  saveMessage,
  updateConversationTitle,
} from './lib/conversations';

// ─── In-memory message type ──────────────────────────────────────────────────
interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  sources?: any[];
  quality?: any;
}

// ─── Key for persisting active conversation in sessionStorage ────────────────
const ACTIVE_CONV_KEY = 'prakriti_active_conv';

// ─── Inner app (requires auth) ───────────────────────────────────────────────
const AppInner: React.FC = () => {
  const { session } = useAuth();
  const authToken = session?.access_token ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStage, setStreamingStage] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [qualityAssessment, setQualityAssessment] = useState<any>(null);
  const [citationsVerified, setCitationsVerified] = useState<boolean | null>(null);
  const [clarificationData, setClarificationData] = useState<any>(null);

  const [environmentalContext, setEnvironmentalContext] = useState<EnvironmentalContextData>({
    region_or_coords: '',
    climate_zone: '',
    soil_organic_carbon_pct: undefined,
    soil_ph: undefined,
    annual_rainfall_mm: undefined,
    current_land_use: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantMsgIdRef = useRef<string | null>(null);
  const assistantContentRef = useRef<string>('');
  const assistantSourcesRef = useRef<any[]>([]);

  // ─── Load conversation list ────────────────────────────────────────────────
  const refreshConversations = useCallback(async () => {
    const list = await listConversations();
    setConversations(list);
    return list;
  }, []);

  useEffect(() => {
    if (!authToken) return;
    refreshConversations().then((list) => {
      // Restore last active conversation from sessionStorage
      const savedId = sessionStorage.getItem(ACTIVE_CONV_KEY);
      if (savedId && list.some((c: Conversation) => c.id === savedId)) {
        loadConversation(savedId);
      }
    });
  }, [authToken]);

  // ─── Cancel stream ─────────────────────────────────────────────────────────
  const handleCancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingStage(null);
    setMessages(prev =>
      prev.map(msg => msg.isStreaming ? { ...msg, isStreaming: false } : msg)
    );
  }, []);

  // ─── Load a conversation's messages ───────────────────────────────────────
  const loadConversation = async (conversationId: string) => {
    handleCancelStream();
    setActiveConversationId(conversationId);
    sessionStorage.setItem(ACTIVE_CONV_KEY, conversationId);
    setEvidenceList([]);
    setQualityAssessment(null);
    setCitationsVerified(null);
    setClarificationData(null);

    const msgs = await loadMessages(conversationId);

    // Map DB messages to UI messages, preserving sources & reconstructing fallback if older records lacked citations
    const uiMsgs: UIMessage[] = msgs.map((m: DBMessage) => {
      let sources = Array.isArray(m.citations) ? m.citations : [];

      // Fallback reconstruction: if sources is empty, but assistant message has [S1], [S2] tags in content
      if (m.role === 'assistant' && sources.length === 0 && m.content) {
        const citedTags = Array.from(new Set(m.content.match(/\[S\d+\]/g) || []));
        if (citedTags.length > 0) {
          sources = citedTags.map(tag => {
            const id = tag.replace(/\[|\]/g, '');
            return {
              id,
              title: `Peer-Reviewed Reference [${id}]`,
              organization: 'Scientific Corpus',
              text: '',
            };
          });
        }
      }

      return {
        id: m.id,
        role: m.role,
        content: m.content,
        sources: sources.length > 0 ? sources : undefined,
      };
    });

    setMessages(uiMsgs);

    // Restore evidenceList and verified state from the last assistant message with sources
    const lastAssistantWithSources = [...uiMsgs].reverse().find(
      m => m.role === 'assistant' && m.sources && m.sources.length > 0
    );
    if (lastAssistantWithSources && lastAssistantWithSources.sources) {
      setEvidenceList(lastAssistantWithSources.sources);
      setCitationsVerified(true);
    } else {
      setEvidenceList([]);
      setCitationsVerified(null);
    }
  };

  // ─── New conversation ──────────────────────────────────────────────────────
  const handleNewConversation = () => {
    handleCancelStream();
    setActiveConversationId(null);
    sessionStorage.removeItem(ACTIVE_CONV_KEY);
    setMessages([]);
    setEvidenceList([]);
    setQualityAssessment(null);
    setCitationsVerified(null);
    setClarificationData(null);
  };

  // ─── Delete conversation ───────────────────────────────────────────────────
  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (activeConversationId === id) handleNewConversation();
    await refreshConversations();
  };

  // ─── Pin / unpin conversation ──────────────────────────────────────────────
  const handlePinToggle = async (id: string, currentPinned: boolean) => {
    // Optimistic update for snappy UX
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, is_pinned: !currentPinned } : c)
    );
    await togglePinConversation(id, currentPinned);
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;

    setClarificationData(null);
    setEvidenceList([]);
    setQualityAssessment(null);
    setCitationsVerified(null);
    setIsStreaming(true);
    setStreamingStage('thinking');

    const userMsgId = `u_${Date.now()}`;
    const assistantMsgId = `a_${Date.now() + 1}`;
    assistantMsgIdRef.current = assistantMsgId;
    assistantContentRef.current = '';
    assistantSourcesRef.current = [];

    // Optimistically add messages to UI
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);

    // Build conversation context from last 6 turns
    const convTurns: ConversationTurnData[] = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Ensure we have a conversation in Supabase
    let convId: string | null = activeConversationId;
    if (!convId) {
      const newConv = await createConversation(text);
      if (newConv) {
        convId = newConv.id;
        setActiveConversationId(convId);
        sessionStorage.setItem(ACTIVE_CONV_KEY, newConv.id);
        await refreshConversations();
      }
    }

    // Save user message to Supabase
    if (convId) {
      const currentConvId = convId;
      await saveMessage(currentConvId, 'user', text);
      // Update conversation title after first message if it's still the default
      const conv = conversations.find((c: Conversation) => c.id === currentConvId);
      if (!conv || conv.title === 'New conversation') {
        const title = text.length > 60 ? text.slice(0, 57) + '…' : text;
        await updateConversationTitle(convId, title);
        await refreshConversations();
      }
    }

    abortControllerRef.current = new AbortController();

    try {
      await streamEnvironmentalQuery({
        question: text,
        environmental_context: environmentalContext,
        conversation_context: convTurns,
        authToken,
        signal: abortControllerRef.current.signal,
        onStatus: (stage) => setStreamingStage(stage),
        onEvidence: (sources, quality) => {
          assistantSourcesRef.current = sources;
          setEvidenceList(sources);
          setQualityAssessment(quality);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId ? { ...msg, sources, quality } : msg
            )
          );
        },
        onToken: (token) => {
          assistantContentRef.current += token;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        onClarification: (clarification) => {
          setClarificationData(clarification);
          setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        },
        onDone: async (doneMetrics, quality, verified) => {
          const finalContent = assistantContentRef.current;
          // Extract citations [S1], [S2] etc. from content
          const citedMatches = finalContent.match(/\[S\d+\]/g) || [];
          const citedIds = new Set(citedMatches.map(m => m.replace(/\[|\]/g, '')));

          const lower = finalContent.toLowerCase();
          const isRefusal =
            lower.includes('only equipped to assist with ecological') ||
            lower.includes('outside my scope') ||
            lower.includes('not equipped to answer') ||
            lower.includes('environmental sciences');

          if (quality) setQualityAssessment(quality);
          setCitationsVerified(verified);
          setIsStreaming(false);
          setStreamingStage(null);

          const rawSources = assistantSourcesRef.current || [];
          const finalFilteredSources = (isRefusal || citedIds.size === 0)
            ? []
            : rawSources.filter((s: any) => citedIds.has(s.id));

          if (isRefusal || citedIds.size === 0) {
            setEvidenceList([]);
            setQualityAssessment(null);
          } else {
            setEvidenceList(finalFilteredSources);
          }

          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    isStreaming: false,
                    sources: finalFilteredSources,
                    quality: (isRefusal || citedIds.size === 0)
                      ? null
                      : (quality || msg.quality),
                  }
                : msg
            )
          );
          // Persist assistant response to Supabase along with its citations
          if (convId && finalContent.trim()) {
            await saveMessage(convId, 'assistant', finalContent, finalFilteredSources);
            await refreshConversations();
          }
        },
        onError: (err) => {
          console.error('Stream error:', err);
          setIsStreaming(false);
          setStreamingStage(null);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content || 'Something went wrong. Please try again.', isStreaming: false }
                : msg
            )
          );
        },
      });
    } catch (e) {
      console.error('Stream invocation error:', e);
      setIsStreaming(false);
      setStreamingStage(null);
    }
  };

  return (
    <Shell
      messages={messages}
      onSendMessage={handleSendMessage}
      onCancelStream={handleCancelStream}
      isStreaming={isStreaming}
      streamingStage={streamingStage}
      environmentalContext={environmentalContext}
      onUpdateContext={setEnvironmentalContext}
      evidenceList={evidenceList}
      qualityAssessment={qualityAssessment}
      citationsVerified={citationsVerified}
      clarificationData={clarificationData}
      onResetChat={handleNewConversation}
      authToken={authToken}
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={loadConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
      onPinToggle={handlePinToggle}
    />
  );
};

// ─── Root router ──────────────────────────────────────────────────────────────
const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // While Supabase restores the session from localStorage, show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-accent-light)] rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <AppInner />;

  if (showAuth) return <AuthModal onClose={() => setShowAuth(false)} />;

  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
};

// ─── Entry point ──────────────────────────────────────────────────────────────
export const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
