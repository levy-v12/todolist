-- Bảng todos: mỗi người dùng chỉ thấy và thêm todo của chính mình.
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index todos_user_id_created_at_idx on public.todos (user_id, created_at desc);

alter table public.todos enable row level security;

grant select, insert on public.todos to authenticated;

create policy "Người dùng xem todo của mình"
  on public.todos
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Người dùng thêm todo của mình"
  on public.todos
  for insert
  to authenticated
  with check (user_id = auth.uid());
