-- Phase 14: ebook length / depth controls on projects

alter table public.ebook_projects
  add column if not exists chapter_length text not null default 'standard'
    check (chapter_length in ('short', 'standard', 'detailed'));

alter table public.ebook_projects
  add column if not exists writing_depth text not null default 'practical'
    check (writing_depth in ('beginner', 'practical', 'expert'));

alter table public.ebook_projects
  add column if not exists include_examples boolean not null default true;

alter table public.ebook_projects
  add column if not exists include_checklists boolean not null default true;

alter table public.ebook_projects
  add column if not exists include_summaries boolean not null default true;

alter table public.ebook_projects
  add column if not exists include_action_steps boolean not null default true;

alter table public.ebook_projects
  add column if not exists chapter_count_mode text
    check (chapter_count_mode is null or chapter_count_mode in ('auto', 'fixed'));

alter table public.ebook_projects
  add column if not exists requested_chapter_count integer
    check (
      requested_chapter_count is null
      or (requested_chapter_count >= 3 and requested_chapter_count <= 50)
    );
