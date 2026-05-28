-- Phase 17: ebook print header/footer settings

alter table public.user_workspace_settings
  add column if not exists export_include_header boolean not null default true;

alter table public.user_workspace_settings
  add column if not exists export_header_text text not null default '';

alter table public.user_workspace_settings
  add column if not exists export_include_footer boolean not null default true;

alter table public.user_workspace_settings
  add column if not exists export_footer_text text not null default '';

alter table public.user_workspace_settings
  add column if not exists export_show_page_numbers boolean not null default true;

alter table public.user_workspace_settings
  add column if not exists export_show_ebook_title_in_header boolean not null default true;

alter table public.user_workspace_settings
  add column if not exists export_show_author_name_in_footer boolean not null default true;
