-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

create table if not exists public.ebook_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  audience text not null,
  goal text not null,
  cover_storage_path text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists ebook_projects_user_id_idx
  on public.ebook_projects (user_id);

create table if not exists public.ebook_chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ebook_projects (id) on delete cascade,
  position integer not null,
  title text not null,
  summary text not null,
  status text not null default 'not_generated'
    check (status in ('not_generated', 'generated')),
  content text,
  created_at timestamptz not null default now(),
  unique (project_id, position)
);

create index if not exists ebook_chapters_project_id_idx
  on public.ebook_chapters (project_id);

alter table public.ebook_projects enable row level security;
alter table public.ebook_chapters enable row level security;

create policy "ebook_projects_select_own"
  on public.ebook_projects
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "ebook_projects_insert_own"
  on public.ebook_projects
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "ebook_projects_update_own"
  on public.ebook_projects
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ebook_projects_delete_own"
  on public.ebook_projects
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "ebook_chapters_select_own_project"
  on public.ebook_chapters
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

create policy "ebook_chapters_insert_own_project"
  on public.ebook_chapters
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

create policy "ebook_chapters_update_own_project"
  on public.ebook_chapters
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

create policy "ebook_chapters_delete_own_project"
  on public.ebook_chapters
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
