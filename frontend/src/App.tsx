import React, { useState, useRef } from 'react';
import { Shell } from './components/layout/Shell';
import { streamEnvironmentalQuery, EnvironmentalContextData, ConversationTurnData } from './lib/sse';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

// Generate base64 mock JWT for optional local multi-tenant test switching (User A vs User B)
function createMockJwt(userId: string, email: string) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    email: email,
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 86400
  }));
  return `${header}.${payload}.`;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStage, setStreamingStage] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [qualityAssessment, setQualityAssessment] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [citationsVerified, setCitationsVerified] = useState<boolean | null>(null);
  const [clarificationData, setClarificationData] = useState<any>(null);

  // Current User Session: Default to Anonymous (Public Scope) for instant zero-barrier querying
  const [currentUser, setCurrentUser] = useState<{ user_id: string; email: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Environmental Context State (Defaulting to Hackathon Wheat Field scenario)
  const [environmentalContext, setEnvironmentalContext] = useState<EnvironmentalContextData>({
    region_or_coords: 'Western India / Semi-Arid Plateau',
    climate_zone: 'Semi-Arid',
    soil_organic_carbon_pct: 0.3,
    soil_ph: 7.8,
    annual_rainfall_mm: 350,
    current_land_use: 'Monoculture wheat with intensive tillage'
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSwitchUser = (persona: 'user_a' | 'user_b' | 'anon') => {
    if (persona === 'user_a') {
      setCurrentUser({ user_id: '11111111-1111-1111-1111-111111111111', email: 'user_a@darukaa.test' });
      setAuthToken(createMockJwt('11111111-1111-1111-1111-111111111111', 'user_a@darukaa.test'));
    } else if (persona === 'user_b') {
      setCurrentUser({ user_id: '22222222-2222-2222-2222-222222222222', email: 'user_b@darukaa.test' });
      setAuthToken(createMockJwt('22222222-2222-2222-2222-222222222222', 'user_b@darukaa.test'));
    } else {
      setCurrentUser(null);
      setAuthToken(null);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;

    setClarificationData(null);
    setIsStreaming(true);
    setStreamingStage('auth');

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }
    ];
    setMessages(newMessages);

    // Build recent conversation turns for contextual memory
    const convTurns: ConversationTurnData[] = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));

    abortControllerRef.current = new AbortController();

    try {
      await streamEnvironmentalQuery({
        question: text,
        environmental_context: environmentalContext,
        conversation_context: convTurns,
        authToken: authToken,
        signal: abortControllerRef.current.signal,
        onStatus: (stage) => {
          setStreamingStage(stage);
        },
        onEvidence: (sources, quality) => {
          setEvidenceList(sources);
          setQualityAssessment(quality);
        },
        onToken: (token) => {
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
          // Remove empty assistant message on zero-llm fast clarification
          setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        },
        onDone: (doneMetrics, quality, verified) => {
          setMetrics(doneMetrics);
          if (quality) setQualityAssessment(quality);
          setCitationsVerified(verified);
          setIsStreaming(false);
          setStreamingStage(null);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        },
        onError: (err) => {
          console.error('Stream failed:', err);
          setIsStreaming(false);
          setStreamingStage(null);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content || 'An error occurred during query generation. Please try again.', isStreaming: false }
                : msg
            )
          );
        }
      });
    } catch (e) {
      console.error('Error invoking stream query:', e);
      setIsStreaming(false);
      setStreamingStage(null);
    }
  };

  const handleCancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingStage(null);
      setMessages(prev =>
        prev.map(msg =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  const handleResetChat = () => {
    handleCancelStream();
    setMessages([]);
    setEvidenceList([]);
    setQualityAssessment(null);
    setMetrics(null);
    setCitationsVerified(null);
    setClarificationData(null);
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
      metrics={metrics}
      citationsVerified={citationsVerified}
      clarificationData={clarificationData}
      onResetChat={handleResetChat}
      currentUser={currentUser}
      onSwitchUser={handleSwitchUser}
      authToken={authToken}
    />
  );
};

export default App;
