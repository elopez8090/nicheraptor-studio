-- Phase 13: personal workspace settings, project organization, custom templates

-- User defaults (single-user personal app, one row per auth user)
create table if not exists public.user_workspace_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_author_name text not null default '',
  default_writing_tone text not null default 'conversational'
    check (default_writing_tone in (
      'conversational', 'professional', 'friendly', 'authoritative', 'educational'
    )),
  default_ebook_style text not null default 'how-to-guide'
    check (default_ebook_style in (
      'how-to-guide', 'beginners-guide', 'checklist-ebook', 'problem-solution',
      'local-business-lead-magnet', 'authority-expert-guide', 'product-buyers-guide', 'niche-report', 'custom'
    )),
  default_audience text not null default '',
  default_export_format text not null default 'pdf'
    check (default_export_format in ('pdf', 'docx', 'markdown')),
  export_include_cover boolean not null default true,
  export_include_toc boolean not null default true,
  export_include_disclaimer boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_workspace_settings enable row level security;

create policy "user_workspace_settings_select_own"
  on public.user_workspace_settings for select to authenticated
  using (auth.uid() = user_id);

create policy "user_workspace_settings_insert_own"
  on public.user_workspace_settings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_workspace_settings_update_own"
  on public.user_workspace_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project organization
alter table public.ebook_projects
  add column if not exists workflow_status text not null default 'idea'
    check (workflow_status in ('idea', 'drafting', 'editing', 'completed'));

alter table public.ebook_projects
  add column if not exists is_starred boolean not null default false;

alter table public.ebook_projects
  add column if not exists is_archived boolean not null default false;

alter table public.ebook_projects
  add column if not exists notes text;

alter table public.ebook_projects
  add column if not exists updated_at timestamptz not null default now();

create index if not exists ebook_projects_workflow_status_idx
  on public.ebook_projects (user_id, workflow_status);

create index if not exists ebook_projects_starred_idx
  on public.ebook_projects (user_id, is_starred)
  where is_starred = true;

create index if not exists ebook_projects_archived_idx
  on public.ebook_projects (user_id, is_archived);

-- Personal outline templates
create table if not exists public.user_ebook_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  default_title text not null,
  default_audience text not null,
  default_goal text not null,
  chapters jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_ebook_templates_user_id_idx
  on public.user_ebook_templates (user_id);

alter table public.user_ebook_templates enable row level security;

create policy "user_ebook_templates_select_own"
  on public.user_ebook_templates for select to authenticated
  using (auth.uid() = user_id);

create policy "user_ebook_templates_insert_own"
  on public.user_ebook_templates for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_ebook_templates_update_own"
  on public.user_ebook_templates for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_ebook_templates_delete_own"
  on public.user_ebook_templates for delete to authenticated
  using (auth.uid() = user_id);
