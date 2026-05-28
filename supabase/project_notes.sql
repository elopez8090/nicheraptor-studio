-- Project notes + research vault (Supabase SQL Editor)
-- CLI: supabase/migrations/20260527180000_project_notes.sql

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ebook_projects (id) on delete cascade,
  chapter_id uuid references public.ebook_chapters (id) on delete set null,
  tag text not null default 'idea'
    check (
      tag in (
        'idea',
        'research',
        'quote',
        'example',
        'source',
        'reminder'
      )
    ),
  title text not null,
  body text not null default '',
  source_url text,
  source_summary text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_notes_project_id_idx
  on public.project_notes (project_id);

create index if not exists project_notes_chapter_id_idx
  on public.project_notes (chapter_id)
  where chapter_id is not null;

create index if not exists project_notes_pinned_idx
  on public.project_notes (project_id, is_pinned desc, updated_at desc);

alter table public.project_notes enable row level security;

create policy "project_notes_select_own_project"
  on public.project_notes
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

create policy "project_notes_insert_own_project"
  on public.project_notes
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

create policy "project_notes_update_own_project"
  on public.project_notes
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

create policy "project_notes_delete_own_project"
  on public.project_notes
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
