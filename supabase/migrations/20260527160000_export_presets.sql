-- Phase 18: PDF export visual presets

alter table public.user_workspace_settings
  add column if not exists export_preset text not null default 'clean-professional'
    check (export_preset in (
      'clean-professional',
      'modern-guide',
      'minimalist',
      'workbook-style',
      'premium-report'
    ));

alter table public.ebook_projects
  add column if not exists export_settings jsonb;
