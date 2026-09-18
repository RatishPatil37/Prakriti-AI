import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
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
      if (savedId && list.some(c => c.id === savedId)) {
        loadConversation(savedId);
      }
    });
  }, [authToken]);

  // ─── Load a conversation's messages ───────────────────────────────────────
  const loadConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    sessionStorage.setItem(ACTIVE_CONV_KEY, conversationId);
    setEvidenceList([]);
    setQualityAssessment(null);
    setCitationsVerified(null);
    setClarificationData(null);

    const msgs = await loadMessages(conversationId);
    setMessages(msgs.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })));
  };

  // ─── New conversation ──────────────────────────────────────────────────────
  const handleNewConversation = () => {
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

  // ─── Cancel stream ─────────────────────────────────────────────────────────
  const handleCancelStream = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingStage(null);
    setMessages(prev =>
      prev.map(msg => msg.isStreaming ? { ...msg, isStreaming: false } : msg)
    );
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;

    setClarificationData(null);
    setIsStreaming(true);
    setStreamingStage('thinking');

    const userMsgId = `u_${Date.now()}`;
    const assistantMsgId = `a_${Date.now() + 1}`;
    assistantMsgIdRef.current = assistantMsgId;
    assistantContentRef.current = '';

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
    let convId = activeConversationId;
    if (!convId) {
      const newConv = await createConversation(text);
      if (newConv) {
        convId = newConv.id;
        setActiveConversationId(convId);
        sessionStorage.setItem(ACTIVE_CONV_KEY, convId);
        await refreshConversations();
      }
    }

    // Save user message to Supabase
    if (convId) {
      await saveMessage(convId, 'user', text);
      // Update conversation title after first message if it's still the default
      const conv = conversations.find(c => c.id === convId);
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
          setEvidenceList(sources);
          setQualityAssessment(quality);
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
          if (quality) setQualityAssessment(quality);
          setCitationsVerified(verified);
          setIsStreaming(false);
          setStreamingStage(null);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
            )
          );
          // Persist assistant response to Supabase
          if (convId && assistantContentRef.current.trim()) {
            await saveMessage(convId, 'assistant', assistantContentRef.current);
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
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;
