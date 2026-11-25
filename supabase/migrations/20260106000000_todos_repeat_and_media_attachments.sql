-- Thêm cột repeat_rule cho public.todos và mở rộng bucket note-attachments
-- hỗ trợ thêm tệp video MP4 và âm thanh MP3, WAV. Chạy lại an toàn.

alter table public.todos
  add column if not exists repeat_rule jsonb;

grant update (repeat_rule)
  on public.todos to authenticated;

update storage.buckets
set allowed_mime_types = array[
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
  'video/mp4',
  'application/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
  'application/octet-stream'
]
where id = 'note-attachments';
