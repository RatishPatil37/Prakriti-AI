import { supabase } from './supabase';

export interface Conversation {
  id: string;
  title: string;
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

// ─── Conversations ──────────────────────────────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(MAX_CONVERSATIONS);

  if (error) {
    console.error('Failed to list conversations:', error.message);
    return [];
  }
  return data ?? [];
}

export async function createConversation(firstMessage?: string): Promise<Conversation | null> {
  const title = firstMessage
    ? firstMessage.length > 60
      ? firstMessage.slice(0, 57) + '…'
      : firstMessage
    : 'New conversation';

  const { data, error } = await supabase
    .from('conversations')
    .insert({ title })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to create conversation:', error.message);
    return null;
  }

  // Enforce max conversation limit — delete oldest if over limit
  await pruneOldConversations();

  return data;
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
}

async function pruneOldConversations(): Promise<void> {
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .order('updated_at', { ascending: true });

  if (data && data.length > MAX_CONVERSATIONS) {
    const toDelete = data.slice(0, data.length - MAX_CONVERSATIONS).map(c => c.id);
    await supabase.from('conversations').delete().in('id', toDelete);
  }
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function loadMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, citations, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load messages:', error.message);
    return [];
  }
  return data ?? [];
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  citations: any[] = []
): Promise<Message | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
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

  return data;
}
