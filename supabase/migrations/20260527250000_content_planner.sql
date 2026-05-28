-- Phase 30: Content planning & strategy layer

create table if not exists public.content_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'Untitled cluster',
  description text not null default '',
  pillar_topic_id uuid,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled idea',
  description text not null default '',
  idea_type text not null default 'article_idea',
  workflow_status text not null default 'idea',
  niche text not null default '',
  target_keyword text not null default '',
  priority smallint not null default 0,
  cluster_id uuid references public.content_clusters (id) on delete set null,
  linked_ebook_project_id uuid references public.ebook_projects (id) on delete set null,
  linked_article_id uuid references public.articles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_topics_idea_type_check check (
    idea_type in (
      'ebook_idea',
      'article_idea',
      'content_cluster',
      'lead_magnet',
      'seo_topic_map',
      'niche_subtopic',
      'faq_opportunity'
    )
  ),
  constraint content_topics_workflow_status_check check (
    workflow_status in (
      'idea',
      'researching',
      'outlining',
      'drafting',
      'editing',
      'published'
    )
  )
);

alter table public.content_clusters
  add constraint content_clusters_pillar_topic_id_fkey
  foreign key (pillar_topic_id) references public.content_topics (id) on delete set null;

create table if not exists public.content_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_kind text not null,
  from_id uuid not null,
  to_kind text not null,
  to_id uuid not null,
  relationship_type text not null default 'related',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint content_relationships_from_kind_check check (
    from_kind in ('topic', 'ebook', 'article')
  ),
  constraint content_relationships_to_kind_check check (
    to_kind in ('topic', 'ebook', 'article')
  ),
  constraint content_relationships_type_check check (
    relationship_type in (
      'related',
      'supports_pillar',
      'lead_magnet_for',
      'article_series',
      'newsletter_expansion',
      'seo_cluster',
      'repurposes'
    )
  )
);

create unique index if not exists content_relationships_unique_edge_idx
  on public.content_relationships (
    user_id,
    from_kind,
    from_id,
    to_kind,
    to_id,
    relationship_type
  );

create table if not exists public.publishing_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Publishing roadmap',
  description text not null default '',
  goal text not null default '',
  target_date date,
  status text not null default 'draft',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishing_roadmaps_status_check check (
    status in ('draft', 'active', 'completed')
  )
);

create index if not exists content_topics_user_updated_idx
  on public.content_topics (user_id, updated_at desc);

create index if not exists content_topics_user_cluster_idx
  on public.content_topics (user_id, cluster_id);

create index if not exists content_clusters_user_updated_idx
  on public.content_clusters (user_id, updated_at desc);

create index if not exists content_relationships_user_from_idx
  on public.content_relationships (user_id, from_kind, from_id);

create index if not exists content_relationships_user_to_idx
  on public.content_relationships (user_id, to_kind, to_id);

create index if not exists publishing_roadmaps_user_updated_idx
  on public.publishing_roadmaps (user_id, updated_at desc);

alter table public.content_clusters enable row level security;
alter table public.content_topics enable row level security;
alter table public.content_relationships enable row level security;
alter table public.publishing_roadmaps enable row level security;

create policy "content_clusters_select_own"
  on public.content_clusters for select to authenticated
  using (auth.uid() = user_id);

create policy "content_clusters_insert_own"
  on public.content_clusters for insert to authenticated
  with check (auth.uid() = user_id);

create policy "content_clusters_update_own"
  on public.content_clusters for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_clusters_delete_own"
  on public.content_clusters for delete to authenticated
  using (auth.uid() = user_id);

create policy "content_topics_select_own"
  on public.content_topics for select to authenticated
  using (auth.uid() = user_id);

create policy "content_topics_insert_own"
  on public.content_topics for insert to authenticated
  with check (auth.uid() = user_id);

create policy "content_topics_update_own"
  on public.content_topics for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_topics_delete_own"
  on public.content_topics for delete to authenticated
  using (auth.uid() = user_id);

create policy "content_relationships_select_own"
  on public.content_relationships for select to authenticated
  using (auth.uid() = user_id);

create policy "content_relationships_insert_own"
  on public.content_relationships for insert to authenticated
  with check (auth.uid() = user_id);

create policy "content_relationships_update_own"
  on public.content_relationships for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_relationships_delete_own"
  on public.content_relationships for delete to authenticated
  using (auth.uid() = user_id);

create policy "publishing_roadmaps_select_own"
  on public.publishing_roadmaps for select to authenticated
  using (auth.uid() = user_id);

create policy "publishing_roadmaps_insert_own"
  on public.publishing_roadmaps for insert to authenticated
  with check (auth.uid() = user_id);

create policy "publishing_roadmaps_update_own"
  on public.publishing_roadmaps for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "publishing_roadmaps_delete_own"
  on public.publishing_roadmaps for delete to authenticated
  using (auth.uid() = user_id);
