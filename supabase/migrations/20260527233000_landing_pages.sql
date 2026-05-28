-- Phase 33: AI Sales & Landing Page Builder

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled landing page',
  slug text,
  page_type text not null default 'lead_magnet_page',
  target_audience text not null default '',
  offer text not null default '',
  cta text not null default '',
  tone text not null default '',
  content_html text not null default '',
  seo_title text,
  seo_description text,
  keyword_targeting text,
  status text not null default 'draft',
  builder_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists landing_pages_user_id_updated_at_idx
  on public.landing_pages (user_id, updated_at desc);

create unique index if not exists landing_pages_user_id_slug_key
  on public.landing_pages (user_id, slug)
  where slug is not null;

alter table public.landing_pages enable row level security;

create policy "landing_pages_select_own"
  on public.landing_pages
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "landing_pages_insert_own"
  on public.landing_pages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "landing_pages_update_own"
  on public.landing_pages
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "landing_pages_delete_own"
  on public.landing_pages
  for delete
  to authenticated
  using (auth.uid() = user_id);
