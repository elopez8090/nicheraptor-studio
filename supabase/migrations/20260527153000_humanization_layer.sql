-- Phase 15: Human-like writing controls per project

alter table public.ebook_projects
  add column if not exists writing_style text not null default 'conversational'
    check (writing_style in (
      'conversational',
      'professional',
      'storytelling',
      'opinionated',
      'casual-expert',
      'direct-response',
      'educational-teacher',
      'minimalist'
    ));

alter table public.ebook_projects
  add column if not exists human_score text not null default 'humanized'
    check (human_score in (
      'balanced-ai',
      'humanized',
      'highly-human',
      'aggressive-humanization'
    ));

alter table public.ebook_projects
  add column if not exists humanization_options jsonb not null default '{}'::jsonb;
