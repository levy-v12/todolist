-- Siết quyền bảng public.todos. Chạy SAU 20260101000000_create_todos.sql và
-- 20260102000000_todos_update_delete.sql. Chạy lại an toàn.
--
-- Lý do: Supabase mặc định cấp toàn quyền trên bảng mới ở schema public cho
-- anon và authenticated, nên "grant update (title, is_done)" ở file trước không
-- thu hẹp được gì. File này thu hồi hết rồi cấp lại đúng phần app cần.
-- Không đổi policy nào. Không đụng tới service_role và postgres.
--
-- Về insert: cấp cấp-bảng (không cấp theo cột) để chắc chắn các giá trị mặc
-- định (id, user_id = auth.uid(), is_done, created_at) luôn được áp dụng. Việc
-- chặn gán user_id của người khác đã có policy insert (with check) lo.
--
-- Cách kiểm:
--   select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'todos'
--   order by 1, 2;
-- Kết quả mong đợi với authenticated: DELETE, INSERT, SELECT (không có UPDATE
-- cấp bảng, vì update chỉ cấp theo cột); anon: không có dòng nào. (Ngoài ra
-- còn dòng của postgres/service_role, không đổi.) Quyền update theo cột xem ở:
--   select grantee, column_name, privilege_type
--   from information_schema.column_privileges
--   where table_schema = 'public' and table_name = 'todos'
--     and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE'
--   order by 1, 2;
-- Mong đợi: chỉ is_done và title của authenticated.

revoke all on public.todos from anon;
revoke all on public.todos from authenticated;

grant select, insert on public.todos to authenticated;
grant update (title, is_done) on public.todos to authenticated;
grant delete on public.todos to authenticated;
