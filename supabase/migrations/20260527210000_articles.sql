-- Phase 22: Article Writing Studio

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled article',
  topic text not null default '',
  target_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  audience text not null default '',
  tone text not null default '',
  article_type text not null default 'blog_post',
  status text not null default 'draft',
  content text not null default '',
  meta_title text,
  meta_description text,
  slug text,
  word_count_target integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_user_id_updated_at_idx
  on public.articles (user_id, updated_at desc);

alter table public.articles enable row level security;

create policy "articles_select_own"
  on public.articles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "articles_insert_own"
  on public.articles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "articles_update_own"
  on public.articles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "articles_delete_own"
  on public.articles
  for delete
  to authenticated
  using (auth.uid() = user_id);
