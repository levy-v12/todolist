-- Cho phép người dùng sửa (title, is_done) và xoá todo của chính mình.
-- Chạy sau 20260101000000_create_todos.sql. Chạy lại an toàn.
-- Không cấp quyền update cho id, user_id, created_at. Không có policy cho anon.

grant update (title, is_done) on public.todos to authenticated;
grant delete on public.todos to authenticated;

drop policy if exists "Người dùng sửa todo của mình" on public.todos;
create policy "Người dùng sửa todo của mình"
  on public.todos
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Người dùng xoá todo của mình" on public.todos;
create policy "Người dùng xoá todo của mình"
  on public.todos
  for delete
  to authenticated
  using (user_id = auth.uid());
