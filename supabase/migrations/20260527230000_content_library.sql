-- Phase 28: Content Library & reusable blocks

create table if not exists public.content_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  favorite boolean not null default false,
  usage_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_library_items_type_check check (
    type in (
      'snippet',
      'framework',
      'prompt',
      'cta',
      'disclaimer',
      'introduction',
      'conclusion',
      'faq',
      'author_bio',
      'checklist'
    )
  )
);

create index if not exists content_library_items_user_updated_idx
  on public.content_library_items (user_id, updated_at desc);

create index if not exists content_library_items_user_type_idx
  on public.content_library_items (user_id, type, updated_at desc);

create index if not exists content_library_items_user_favorite_idx
  on public.content_library_items (user_id, favorite)
  where favorite = true;

create table if not exists public.content_library_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint content_library_tags_name_nonempty check (char_length(trim(name)) > 0)
);

alter table public.content_library_tags
  add constraint content_library_tags_user_id_name_key unique (user_id, name);

alter table public.content_library_items enable row level security;
alter table public.content_library_tags enable row level security;

create policy "content_library_items_select_own"
  on public.content_library_items
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "content_library_items_insert_own"
  on public.content_library_items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "content_library_items_update_own"
  on public.content_library_items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_library_items_delete_own"
  on public.content_library_items
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "content_library_tags_select_own"
  on public.content_library_tags
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "content_library_tags_insert_own"
  on public.content_library_tags
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "content_library_tags_update_own"
  on public.content_library_tags
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_library_tags_delete_own"
  on public.content_library_tags
  for delete
  to authenticated
  using (auth.uid() = user_id);
