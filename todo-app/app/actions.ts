"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTitle } from "@/lib/todos";

export type AddTodoState = {
  error?: string;
  // Tăng sau mỗi lần thêm thành công để form xoá ô nhập.
  successCount: number;
  // Giữ lại nội dung đã nhập khi có lỗi để người dùng không phải gõ lại.
  title?: string;
};

// user_id không lấy từ form: cột có mặc định auth.uid() và RLS kiểm tra lại.
export async function addTodo(
  prevState: AddTodoState,
  formData: FormData,
): Promise<AddTodoState> {
  const rawTitle = formData.get("title");
  const typed = typeof rawTitle === "string" ? rawTitle : "";
  const fail = (error: string): AddTodoState => ({
    error,
    title: typed,
    successCount: prevState.successCount,
  });

  const validation = validateTitle(rawTitle);
  if (!validation.ok) return fail(validation.error);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return fail("Bạn cần đăng nhập để thêm công việc.");
    }

    const { error } = await supabase
      .from("todos")
      .insert({ title: validation.title });
    if (error) {
      return fail("Không thể thêm công việc. Vui lòng thử lại.");
    }
  } catch {
    return fail("Không thể thêm công việc. Vui lòng thử lại.");
  }

  revalidatePath("/");
  return { successCount: prevState.successCount + 1 };
}
