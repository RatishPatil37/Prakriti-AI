# Database Schema — Darukaa.Earth

## Postgres tables

```sql
create table public.documents (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    storage_path text,
    scope text not null default 'private'
        check (scope in ('private', 'workspace')),
    status text not null default 'pending'
        check (status in ('pending','processing','indexing','ready','failed','deleting','deleted')),
    content_hash text,
    page_count integer,
    chunk_count integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.conversations (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    title text,
    summary text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('user','assistant','system')),
    content text not null,
    citations jsonb not null default '[]'::jsonb,
    request_id uuid,
    created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "documents owner select"
on public.documents
for select
to authenticated
using ((select auth.uid()) = owner_user_id);

create policy "documents owner insert"
on public.documents
for insert
to authenticated
with check ((select auth.uid()) = owner_user_id);

create policy "documents owner delete"
on public.documents
for delete
to authenticated
using ((select auth.uid()) = owner_user_id);

create policy "conversations owner all"
on public.conversations
for all
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

create policy "messages owner all"
on public.messages
for all
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);
```

## Important

A backend using the Supabase service role key bypasses RLS. Therefore backend queries must still explicitly scope by `owner_user_id`.

RLS is a second safety layer, not permission to remove application authorization.
