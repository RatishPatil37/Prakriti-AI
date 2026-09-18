-- =====================================================================
-- Darukaa.Earth AI — Supabase Database Migration & RLS Security Schema
-- Paste and run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =====================================================================

-- 1. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_path TEXT,
    scope TEXT NOT NULL DEFAULT 'private' CHECK (scope IN ('private', 'workspace', 'public')),
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'processing', 'indexing', 'ready', 'failed', 'deleting', 'deleted')),
    content_hash TEXT,
    page_count INTEGER,
    chunk_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Documents Policies
DROP POLICY IF EXISTS "documents owner select" ON public.documents;
CREATE POLICY "documents owner select"
ON public.documents FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "documents owner insert" ON public.documents;
CREATE POLICY "documents owner insert"
ON public.documents FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "documents owner update" ON public.documents;
CREATE POLICY "documents owner update"
ON public.documents FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "documents owner delete" ON public.documents;
CREATE POLICY "documents owner delete"
ON public.documents FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = owner_user_id);

-- 6. Conversations Policies
DROP POLICY IF EXISTS "conversations owner all" ON public.conversations;
CREATE POLICY "conversations owner all"
ON public.conversations FOR ALL TO authenticated
USING ((SELECT auth.uid()) = owner_user_id)
WITH CHECK ((SELECT auth.uid()) = owner_user_id);

-- 7. Messages Policies
DROP POLICY IF EXISTS "messages owner all" ON public.messages;
CREATE POLICY "messages owner all"
ON public.messages FOR ALL TO authenticated
USING ((SELECT auth.uid()) = owner_user_id)
WITH CHECK ((SELECT auth.uid()) = owner_user_id);

-- 8. Indexes for Rapid Querying
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
