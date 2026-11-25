-- Thêm nội dung chi tiết (content) và danh sách ảnh đính kèm (attachments)
-- cho bảng public.todos, kèm bucket Storage "note-attachments" (tối đa 20MB).
-- Chạy lại an toàn.

alter table public.todos
  add column if not exists content text not null default '',
  add column if not exists attachments jsonb not null default '[]'::jsonb;

grant update (content, attachments)
  on public.todos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-attachments',
  'note-attachments',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/x-raw',
    'image/x-panasonic-raw',
    'image/x-canon-cr2',
    'image/x-nikon-nef',
    'image/x-sony-arw',
    'image/x-adobe-dng',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Người dùng xem ảnh note của mình" on storage.objects;
create policy "Người dùng xem ảnh note của mình"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'note-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Người dùng tải ảnh note của mình" on storage.objects;
create policy "Người dùng tải ảnh note của mình"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'note-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Người dùng xoá ảnh note của mình" on storage.objects;
create policy "Người dùng xoá ảnh note của mình"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'note-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
