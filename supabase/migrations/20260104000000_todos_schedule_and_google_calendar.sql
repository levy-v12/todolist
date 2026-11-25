-- Thêm cột hẹn ngày giờ (due_at) và thông tin đồng bộ Google Calendar cho todos,
-- cùng bảng lưu kết nối Google Calendar theo từng người dùng. Chạy lại an toàn.

alter table public.todos
  add column if not exists due_at timestamptz,
  add column if not exists google_event_id text,
  add column if not exists google_event_link text;

create index if not exists todos_user_id_due_at_idx
  on public.todos (user_id, due_at);

grant update (due_at, google_event_id, google_event_link)
  on public.todos to authenticated;

create table if not exists public.google_calendar_connections (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  mode text not null default 'oauth' check (mode in ('oauth', 'demo')),
  google_email text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

revoke all on public.google_calendar_connections from anon;
revoke all on public.google_calendar_connections from authenticated;
grant select, insert, update, delete on public.google_calendar_connections to authenticated;

drop policy if exists "Người dùng xem kết nối Google Calendar của mình"
  on public.google_calendar_connections;
create policy "Người dùng xem kết nối Google Calendar của mình"
  on public.google_calendar_connections
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Người dùng thêm kết nối Google Calendar của mình"
  on public.google_calendar_connections;
create policy "Người dùng thêm kết nối Google Calendar của mình"
  on public.google_calendar_connections
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Người dùng cập nhật kết nối Google Calendar của mình"
  on public.google_calendar_connections;
create policy "Người dùng cập nhật kết nối Google Calendar của mình"
  on public.google_calendar_connections
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Người dùng xoá kết nối Google Calendar của mình"
  on public.google_calendar_connections;
create policy "Người dùng xoá kết nối Google Calendar của mình"
  on public.google_calendar_connections
  for delete
  to authenticated
  using (user_id = auth.uid());
