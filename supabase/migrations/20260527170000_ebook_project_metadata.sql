-- Phase 19: ebook project metadata for settings page

alter table public.ebook_projects
  add column if not exists subtitle text not null default '';

alter table public.ebook_projects
  add column if not exists author_name text not null default '';

alter table public.ebook_projects
  add column if not exists niche text not null default '';
