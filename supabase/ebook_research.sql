-- Research notes and sources per ebook project (run in Supabase SQL Editor)

create table if not exists public.ebook_research_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ebook_projects (id) on delete cascade,
  chapter_id uuid references public.ebook_chapters (id) on delete set null,
  research_type text not null
    check (
      research_type in (
        'topic',
        'chapter',
        'statistics',
        'trends',
        'faqs',
        'examples',
        'manual_note'
      )
    ),
  title text not null,
  summary text not null default '',
  content text not null default '',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ebook_research_entries_project_id_idx
  on public.ebook_research_entries (project_id);

create index if not exists ebook_research_entries_chapter_id_idx
  on public.ebook_research_entries (chapter_id)
  where chapter_id is not null;

alter table public.ebook_projects
  add column if not exists include_source_references boolean not null default false;

alter table public.ebook_research_entries enable row level security;

create policy "ebook_research_select_own_project"
  on public.ebook_research_entries
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

create policy "ebook_research_insert_own_project"
  on public.ebook_research_entries
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

create policy "ebook_research_update_own_project"
  on public.ebook_research_entries
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

create policy "ebook_research_delete_own_project"
  on public.ebook_research_entries
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
