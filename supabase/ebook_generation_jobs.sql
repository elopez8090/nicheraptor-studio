-- Run in Supabase SQL Editor after ebook_tables.sql

create table if not exists public.ebook_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.ebook_projects (id) on delete cascade,
  status text not null default 'idle'
    check (status in ('idle', 'running', 'completed', 'failed', 'cancelled')),
  quality text not null default 'balanced'
    check (quality in ('fast', 'balanced', 'premium')),
  current_chapter_index integer not null default 0,
  total_chapters integer not null default 0,
  failed_chapter_id uuid references public.ebook_chapters (id) on delete set null,
  error_message text,
  tokens_used integer not null default 0,
  cancel_requested boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists ebook_generation_jobs_project_id_idx
  on public.ebook_generation_jobs (project_id);

alter table public.ebook_generation_jobs enable row level security;

create policy "ebook_generation_jobs_select_own_project"
  on public.ebook_generation_jobs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ebook_projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );

create policy "ebook_generation_jobs_insert_own_project"
  on public.ebook_generation_jobs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.ebook_projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );

create policy "ebook_generation_jobs_update_own_project"
  on public.ebook_generation_jobs
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.ebook_projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ebook_projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );

create policy "ebook_generation_jobs_delete_own_project"
  on public.ebook_generation_jobs
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.ebook_projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );
