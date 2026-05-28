create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ebook_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null
    check (status in ('queued', 'pending', 'running', 'completed', 'failed', 'cancelled')),
  current_step integer not null default 0,
  total_steps integer not null default 0,
  progress_percentage integer not null default 0,
  error_message text,
  quality text not null,
  cancel_requested boolean not null default false,
  failed_chapter_id uuid references public.ebook_chapters (id) on delete set null,
  current_chapter_id uuid references public.ebook_chapters (id) on delete set null,
  current_chapter_title text,
  chapter_plan jsonb not null default '[]'::jsonb,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists generation_jobs_project_id_idx
  on public.generation_jobs (project_id);

create index if not exists generation_jobs_user_id_idx
  on public.generation_jobs (user_id);

create index if not exists generation_jobs_status_idx
  on public.generation_jobs (status);

alter table public.generation_jobs enable row level security;

drop policy if exists "generation_jobs_select_own" on public.generation_jobs;
create policy "generation_jobs_select_own"
  on public.generation_jobs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "generation_jobs_insert_own_project" on public.generation_jobs;
create policy "generation_jobs_insert_own_project"
  on public.generation_jobs
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

drop policy if exists "generation_jobs_update_own" on public.generation_jobs;
create policy "generation_jobs_update_own"
  on public.generation_jobs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "generation_jobs_delete_own" on public.generation_jobs;
create policy "generation_jobs_delete_own"
  on public.generation_jobs
  for delete
  to authenticated
  using (auth.uid() = user_id);

