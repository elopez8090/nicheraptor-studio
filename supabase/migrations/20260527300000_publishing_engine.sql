-- Phase 31: Automation & Publishing Engine

create table if not exists public.publishing_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  platform_type text not null,
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  webhook_url text,
  rss_feed_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishing_targets_platform_type_check check (
    platform_type in (
      'wordpress',
      'webflow',
      'ghost',
      'beehiiv',
      'substack',
      'medium',
      'markdown_export',
      'html_export'
    )
  )
);

create index if not exists publishing_targets_user_updated_idx
  on public.publishing_targets (user_id, updated_at desc);

create unique index if not exists publishing_targets_user_platform_uidx
  on public.publishing_targets (user_id, platform_type);

create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  planned_publish_date date,
  publishing_priority integer not null default 0,
  content_type text not null default 'article',
  target_platform text not null default 'markdown_export',
  queue_id uuid,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_calendar_content_type_check check (
    content_type in (
      'article',
      'newsletter',
      'social',
      'ebook',
      'lead_magnet',
      'faq',
      'thread'
    )
  ),
  constraint content_calendar_target_platform_check check (
    target_platform in (
      'wordpress',
      'webflow',
      'ghost',
      'beehiiv',
      'substack',
      'medium',
      'markdown_export',
      'html_export'
    )
  )
);

create index if not exists content_calendar_user_planned_idx
  on public.content_calendar (user_id, planned_publish_date asc nulls last);

create table if not exists public.publishing_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  body_html text not null default '',
  body_markdown text not null default '',
  source_type text not null default 'manual',
  source_article_id uuid references public.articles (id) on delete set null,
  source_ebook_project_id uuid,
  source_chapter_id uuid,
  publishing_target_id uuid references public.publishing_targets (id) on delete set null,
  target_platform text not null default 'markdown_export',
  status text not null default 'draft',
  content_type text not null default 'article',
  priority integer not null default 0,
  scheduled_at timestamptz,
  published_at timestamptz,
  error_message text,
  calendar_entry_id uuid references public.content_calendar (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishing_queue_status_check check (
    status in ('draft', 'scheduled', 'ready_to_publish', 'published', 'failed')
  ),
  constraint publishing_queue_source_type_check check (
    source_type in ('manual', 'article', 'ebook_chapter', 'ebook', 'repurposed')
  ),
  constraint publishing_queue_content_type_check check (
    content_type in (
      'article',
      'newsletter',
      'social',
      'lead_magnet',
      'faq',
      'thread'
    )
  ),
  constraint publishing_queue_target_platform_check check (
    target_platform in (
      'wordpress',
      'webflow',
      'ghost',
      'beehiiv',
      'substack',
      'medium',
      'markdown_export',
      'html_export'
    )
  )
);

create index if not exists publishing_queue_user_status_updated_idx
  on public.publishing_queue (user_id, status, updated_at desc);

alter table public.content_calendar
  add constraint content_calendar_queue_id_fkey
  foreign key (queue_id) references public.publishing_queue (id) on delete set null;

create table if not exists public.content_repurposing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workflow text not null,
  source_type text not null,
  source_article_id uuid references public.articles (id) on delete set null,
  source_ebook_project_id uuid,
  source_chapter_id uuid,
  status text not null default 'pending',
  input_snapshot jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint content_repurposing_jobs_workflow_check check (
    workflow in (
      'ebook_chapter_to_article',
      'article_to_newsletter',
      'article_to_social',
      'ebook_to_lead_magnet',
      'article_to_faq',
      'article_to_thread_series',
      'convert_to_article',
      'convert_to_newsletter',
      'social_snippets',
      'tweet_thread_ideas',
      'linkedin_post',
      'cta_variations'
    )
  ),
  constraint content_repurposing_jobs_source_type_check check (
    source_type in ('article', 'ebook_chapter', 'ebook', 'manual')
  ),
  constraint content_repurposing_jobs_status_check check (
    status in ('pending', 'running', 'completed', 'failed')
  )
);

create index if not exists content_repurposing_jobs_user_created_idx
  on public.content_repurposing_jobs (user_id, created_at desc);

create table if not exists public.publishing_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  template_kind text not null,
  platform_hint text,
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishing_templates_kind_check check (
    template_kind in ('newsletter', 'article', 'cta', 'social')
  )
);

create index if not exists publishing_templates_user_kind_idx
  on public.publishing_templates (user_id, template_kind, updated_at desc);

alter table public.publishing_targets enable row level security;
alter table public.content_calendar enable row level security;
alter table public.publishing_queue enable row level security;
alter table public.content_repurposing_jobs enable row level security;
alter table public.publishing_templates enable row level security;

create policy "publishing_targets_select_own"
  on public.publishing_targets for select to authenticated
  using (auth.uid() = user_id);

create policy "publishing_targets_insert_own"
  on public.publishing_targets for insert to authenticated
  with check (auth.uid() = user_id);

create policy "publishing_targets_update_own"
  on public.publishing_targets for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "publishing_targets_delete_own"
  on public.publishing_targets for delete to authenticated
  using (auth.uid() = user_id);

create policy "content_calendar_select_own"
  on public.content_calendar for select to authenticated
  using (auth.uid() = user_id);

create policy "content_calendar_insert_own"
  on public.content_calendar for insert to authenticated
  with check (auth.uid() = user_id);

create policy "content_calendar_update_own"
  on public.content_calendar for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_calendar_delete_own"
  on public.content_calendar for delete to authenticated
  using (auth.uid() = user_id);

create policy "publishing_queue_select_own"
  on public.publishing_queue for select to authenticated
  using (auth.uid() = user_id);

create policy "publishing_queue_insert_own"
  on public.publishing_queue for insert to authenticated
  with check (auth.uid() = user_id);

create policy "publishing_queue_update_own"
  on public.publishing_queue for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "publishing_queue_delete_own"
  on public.publishing_queue for delete to authenticated
  using (auth.uid() = user_id);

create policy "content_repurposing_jobs_select_own"
  on public.content_repurposing_jobs for select to authenticated
  using (auth.uid() = user_id);

create policy "content_repurposing_jobs_insert_own"
  on public.content_repurposing_jobs for insert to authenticated
  with check (auth.uid() = user_id);

create policy "content_repurposing_jobs_update_own"
  on public.content_repurposing_jobs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_repurposing_jobs_delete_own"
  on public.content_repurposing_jobs for delete to authenticated
  using (auth.uid() = user_id);

create policy "publishing_templates_select_own"
  on public.publishing_templates for select to authenticated
  using (auth.uid() = user_id);

create policy "publishing_templates_insert_own"
  on public.publishing_templates for insert to authenticated
  with check (auth.uid() = user_id);

create policy "publishing_templates_update_own"
  on public.publishing_templates for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "publishing_templates_delete_own"
  on public.publishing_templates for delete to authenticated
  using (auth.uid() = user_id);
