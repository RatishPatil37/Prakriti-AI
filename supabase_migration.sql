-- Migration: Add is_pinned column and DEFAULT owner_user_id to conversations
-- Run this in your Supabase SQL Editor (Project -> SQL Editor -> New Query)

-- 1. Add is_pinned column to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add index for fast pinned queries
CREATE INDEX IF NOT EXISTS idx_conversations_is_pinned
  ON conversations (owner_user_id, is_pinned, updated_at DESC);

-- 3. Ensure owner_user_id defaults to the authenticated user (RLS safety net)
-- This prevents NULL owner_user_id inserts from passing RLS
ALTER TABLE conversations
  ALTER COLUMN owner_user_id SET DEFAULT auth.uid();

ALTER TABLE messages
  ALTER COLUMN owner_user_id SET DEFAULT auth.uid();

-- 4. Verify RLS policies exist (add if missing)
-- conversations: each user can only see their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversations' AND policyname = 'conversations_owner_policy'
  ) THEN
    CREATE POLICY conversations_owner_policy ON conversations
      FOR ALL USING (owner_user_id = auth.uid())
      WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

-- messages: each user can only see messages in their conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'messages_owner_policy'
  ) THEN
    CREATE POLICY messages_owner_policy ON messages
      FOR ALL USING (owner_user_id = auth.uid())
      WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;
