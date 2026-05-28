-- Phase 29: project AI memory, chapter summaries, future embedding hooks

create table if not exists public.project_ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_kind text not null check (project_kind in ('ebook', 'article')),
  ebook_project_id uuid references public.ebook_projects (id) on delete cascade,
  article_id uuid references public.articles (id) on delete cascade,
  voice_profile text,
  memory jsonb not null default '{}'::jsonb,
  embedding_status text not null default 'none'
    check (embedding_status in ('none', 'pending', 'ready')),
  embedding_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_ai_memory_one_target check (
    (project_kind = 'ebook' and ebook_project_id is not null and article_id is null)
    or (project_kind = 'article' and article_id is not null and ebook_project_id is null)
  )
);

create unique index if not exists project_ai_memory_ebook_project_id_uidx
  on public.project_ai_memory (ebook_project_id)
  where ebook_project_id is not null;

create unique index if not exists project_ai_memory_article_id_uidx
  on public.project_ai_memory (article_id)
  where article_id is not null;

create index if not exists project_ai_memory_user_id_idx
  on public.project_ai_memory (user_id);

create table if not exists public.chapter_content_summaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ebook_projects (id) on delete cascade,
  chapter_id uuid not null references public.ebook_chapters (id) on delete cascade,
  summary text not null default '',
  key_concepts text[] not null default '{}',
  terminology jsonb not null default '[]'::jsonb,
  explained_topics text[] not null default '{}',
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id)
);

create index if not exists chapter_content_summaries_project_id_idx
  on public.chapter_content_summaries (project_id);

alter table public.project_ai_memory enable row level security;
alter table public.chapter_content_summaries enable row level security;

create policy "project_ai_memory_select_own"
  on public.project_ai_memory
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "project_ai_memory_insert_own"
  on public.project_ai_memory
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "project_ai_memory_update_own"
  on public.project_ai_memory
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "project_ai_memory_delete_own"
  on public.project_ai_memory
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "chapter_summaries_select_own_project"
  on public.chapter_content_summaries
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

create policy "chapter_summaries_insert_own_project"
  on public.chapter_content_summaries
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

create policy "chapter_summaries_update_own_project"
  on public.chapter_content_summaries
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

create policy "chapter_summaries_delete_own_project"
  on public.chapter_content_summaries
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
