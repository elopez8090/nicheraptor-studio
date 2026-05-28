-- Phase 15: expand workspace default writing tone options

do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'user_workspace_settings'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%default_writing_tone%';

  if constraint_name is not null then
    execute format(
      'alter table public.user_workspace_settings drop constraint %I',
      constraint_name
    );
  end if;
end $$;

alter table public.user_workspace_settings
  add constraint user_workspace_settings_default_writing_tone_check
  check (default_writing_tone in (
    'conversational',
    'professional',
    'storytelling',
    'opinionated',
    'casual-expert',
    'direct-response',
    'educational-teacher',
    'minimalist'
  ));
