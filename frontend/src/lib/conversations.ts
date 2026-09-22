import { supabase } from './supabase';

export interface Conversation {
  id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: any[];
  created_at: string;
}

const MAX_CONVERSATIONS = 20;

// ─── Local cache helpers ──────────────────────────────────────────────────────

function cacheKey(userId: string) {
  return `prakriti_convs_${userId}`;
}

function msgCacheKey(userId: string, convId: string) {
  return `prakriti_msgs_${userId}_${convId}`;
}

function saveConvsToCache(userId: string, conversations: Conversation[]) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(conversations));
  } catch {}
}

function loadConvsFromCache(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMsgsToCache(userId: string, convId: string, messages: Message[]) {
  try {
    localStorage.setItem(msgCacheKey(userId, convId), JSON.stringify(messages));
  } catch (err: any) {
    // If browser localStorage quota (5MB) is exceeded, evict older cached conversation messages
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      try {
        const msgKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`prakriti_msgs_${userId}_`) && key !== msgCacheKey(userId, convId)) {
            msgKeys.push(key);
          }
        }
        // Remove half of the oldest cached conversations to recover quota
        const toEvict = msgKeys.slice(0, Math.max(1, Math.floor(msgKeys.length / 2)));
        toEvict.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(msgCacheKey(userId, convId), JSON.stringify(messages));
      } catch {}
    }
  }
}

function loadMsgsFromCache(userId: string, convId: string): Message[] {
  try {
    const raw = localStorage.getItem(msgCacheKey(userId, convId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Conversations ──────────────────────────────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, is_pinned, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(MAX_CONVERSATIONS + 10); // Fetch a few extra to account for pinned ones

  if (error) {
    console.error('Failed to list conversations:', error.message);
    // Fallback to local cache
    return userId ? loadConvsFromCache(userId) : [];
  }

  const result: Conversation[] = (data ?? []).map(d => ({
    ...d,
    is_pinned: d.is_pinned ?? false,
  }));

  if (userId) saveConvsToCache(userId, result);
  return result;
}

export async function createConversation(firstMessage?: string): Promise<Conversation | null> {
  // ── FIX: Fetch the auth user and pass owner_user_id to satisfy RLS ──
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    console.error('Cannot create conversation: user not authenticated');
    return null;
  }

  const title = firstMessage
    ? firstMessage.length > 60
      ? firstMessage.slice(0, 57) + '…'
      : firstMessage
    : 'New conversation';

  const { data, error } = await supabase
    .from('conversations')
    .insert({ title, owner_user_id: userId, is_pinned: false })
    .select('id, title, is_pinned, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to create conversation:', error.message);
    return null;
  }

  const conv: Conversation = { ...data, is_pinned: data.is_pinned ?? false };

  // Enforce max conversation limit — delete oldest *unpinned* if over limit
  await pruneOldConversations();

  // Update local cache
  const cached = loadConvsFromCache(userId);
  saveConvsToCache(userId, [conv, ...cached].slice(0, MAX_CONVERSATIONS + 10));

  return conv;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function touchConversation(id: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function deleteConversation(id: string): Promise<void> {
  // Messages cascade on delete via FK
  await supabase.from('conversations').delete().eq('id', id);

  // Remove from local cache
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userId) {
    const cached = loadConvsFromCache(userId).filter(c => c.id !== id);
    saveConvsToCache(userId, cached);
    localStorage.removeItem(msgCacheKey(userId, id));
  }
}

export async function togglePinConversation(id: string, currentPinned: boolean): Promise<void> {
  const newPinned = !currentPinned;
  const { error } = await supabase
    .from('conversations')
    .update({ is_pinned: newPinned, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Failed to toggle pin:', error.message);
    return;
  }

  // Update local cache
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userId) {
    const cached = loadConvsFromCache(userId).map(c =>
      c.id === id ? { ...c, is_pinned: newPinned } : c
    );
    saveConvsToCache(userId, cached);
  }
}

async function pruneOldConversations(): Promise<void> {
  // Only prune unpinned conversations to protect pinned ones
  const { data } = await supabase
    .from('conversations')
    .select('id, is_pinned')
    .eq('is_pinned', false)
    .order('updated_at', { ascending: true });

  if (data && data.length > MAX_CONVERSATIONS) {
    const toDelete = data.slice(0, data.length - MAX_CONVERSATIONS).map(c => c.id);
    await supabase.from('conversations').delete().in('id', toDelete);

    // Also clean up local cache so localStorage does not leak pruned records
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      toDelete.forEach(id => localStorage.removeItem(msgCacheKey(userId, id)));
      const cached = loadConvsFromCache(userId).filter(c => !toDelete.includes(c.id));
      saveConvsToCache(userId, cached);
    }
  }
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function loadMessages(conversationId: string): Promise<Message[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, citations, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load messages:', error.message);
    // Fallback to local cache
    return userId ? loadMsgsFromCache(userId, conversationId) : [];
  }

  const result = data ?? [];
  if (userId) saveMsgsToCache(userId, conversationId, result);
  return result;
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  citations: any[] = []
): Promise<Message | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      owner_user_id: userId,
      role,
      content,
      citations,
    })
    .select('id, conversation_id, role, content, citations, created_at')
    .single();

  if (error) {
    console.error('Failed to save message:', error.message);
    return null;
  }

  // Bump the conversation's updated_at so it floats to the top
  await touchConversation(conversationId);

  // Update local message cache
  const cached = loadMsgsFromCache(userId, conversationId);
  saveMsgsToCache(userId, conversationId, [...cached, data]);

  return data;
}
