-- Run in Supabase SQL Editor after auth migration (20260527_auth_user_owned_projects.sql)
-- Creates the ebook-covers bucket and RLS policies for per-user paths: {user_id}/{project_id}/cover.png

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ebook-covers',
  'ebook-covers',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Remove old policies if re-running
drop policy if exists "ebook_covers_select_own" on storage.objects;
drop policy if exists "ebook_covers_insert_own" on storage.objects;
drop policy if exists "ebook_covers_update_own" on storage.objects;
drop policy if exists "ebook_covers_delete_own" on storage.objects;

create policy "ebook_covers_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'ebook-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ebook_covers_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'ebook-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ebook_covers_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'ebook-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'ebook-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ebook_covers_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'ebook-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
