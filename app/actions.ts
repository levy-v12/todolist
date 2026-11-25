"use server";

import { revalidatePath } from "next/cache";
import {
  removeTodoFromGoogleCalendarIfLinked,
  syncTodosWithGoogleCalendar,
} from "@/lib/google-calendar";
import {
  sanitizeNoteHtml,
  validateAttachmentsPayload,
  type NoteAttachment,
} from "@/lib/note-content";
import { validateRepeatRule, type RepeatRule } from "@/lib/repeat";
import { createClient } from "@/lib/supabase/server";
import { isUuid, validateDueAt, validateTitle } from "@/lib/todos";

export type AddTodoState = {
  error?: string;
  // Tăng sau mỗi lần thêm thành công để form xoá ô nhập.
  successCount: number;
  // Giữ lại nội dung đã nhập khi có lỗi để người dùng không phải gõ lại.
  title?: string;
};

const INVALID_REQUEST = "Yêu cầu không hợp lệ.";

// Server Action là endpoint công khai: tham số có thể không phải FormData.
const isFormData = (input: unknown): input is FormData =>
  input instanceof FormData;

// user_id không lấy từ form: cột có mặc định auth.uid() và RLS kiểm tra lại.
export async function addTodo(
  prevState: AddTodoState,
  formData: FormData,
): Promise<AddTodoState> {
  if (!isFormData(formData)) {
    return { error: INVALID_REQUEST, successCount: prevState.successCount };
  }
  const rawTitle = formData.get("title");
  const rawDueAt = formData.get("due_at");
  const rawContent = formData.get("content");
  const rawAttachments = formData.get("attachments");
  const rawRepeatRule = formData.get("repeat_rule");
  const typed = typeof rawTitle === "string" ? rawTitle : "";
  const fail = (error: string): AddTodoState => ({
    error,
    title: typed,
    successCount: prevState.successCount,
  });

  const validation = validateTitle(rawTitle);
  if (!validation.ok) return fail(validation.error);

  const dueValidation = validateDueAt(rawDueAt);
  if (!dueValidation.ok) return fail(dueValidation.error);

  const safeContent = sanitizeNoteHtml(rawContent);
  const attachValidation = validateAttachmentsPayload(rawAttachments);
  if (!attachValidation.ok) return fail(attachValidation.error);

  const repeatValidation = validateRepeatRule(rawRepeatRule);
  if (!repeatValidation.ok) return fail(repeatValidation.error);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return fail("Bạn cần đăng nhập để thêm công việc.");
    }

    const hasOptionalFields =
      Boolean(dueValidation.dueAt) ||
      safeContent.length > 0 ||
      attachValidation.attachments.length > 0 ||
      Boolean(repeatValidation.repeatRule);

    if (hasOptionalFields) {
      const insertPayload: {
        title: string;
        due_at?: string;
        content?: string;
        attachments?: NoteAttachment[];
        repeat_rule?: RepeatRule;
      } = { title: validation.title };

      if (dueValidation.dueAt) insertPayload.due_at = dueValidation.dueAt;
      if (safeContent.length > 0) insertPayload.content = safeContent;
      if (attachValidation.attachments.length > 0) {
        insertPayload.attachments = attachValidation.attachments;
      }
      if (repeatValidation.repeatRule) {
        insertPayload.repeat_rule = repeatValidation.repeatRule;
      }

      const { data, error } = await supabase
        .from("todos")
        .insert(insertPayload)
        .select("id");
      if (error) {
        return fail("Không thể thêm công việc. Vui lòng thử lại.");
      }
      const insertedId = data?.[0]?.id;
      if (insertedId && dueValidation.dueAt) {
        await syncTodosWithGoogleCalendar(supabase, user.id, insertedId);
      }
    } else {
      const { error } = await supabase
        .from("todos")
        .insert({ title: validation.title });
      if (error) {
        return fail("Không thể thêm công việc. Vui lòng thử lại.");
      }
    }
  } catch {
    return fail("Không thể thêm công việc. Vui lòng thử lại.");
  }

  revalidatePath("/");
  return { successCount: prevState.successCount + 1 };
}

export type TodoActionResult = { ok: true } | { ok: false; error: string };
export type GoogleCalendarSyncResult =
  | { ok: true; syncedCount: number; mode?: "oauth" | "demo" }
  | { ok: false; error: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;
type MutationResult = {
  data: { id: string }[] | null;
  error: unknown;
};

const failure = (error: string): TodoActionResult => ({ ok: false, error });

// Phần chung của sửa/xoá: kiểm tra id, lấy người dùng, chạy truy vấn, phát hiện
// 0 dòng bị tác động (RLS lặng lẽ trả 0 dòng chứ không báo lỗi).
async function mutateTodo(
  rawId: FormDataEntryValue | null,
  messages: { login: string; failed: string },
  run: (
    supabase: Supabase,
    userId: string,
    id: string,
  ) => PromiseLike<MutationResult>,
): Promise<TodoActionResult> {
  if (!isUuid(rawId)) return failure("Công việc không hợp lệ.");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return failure(messages.login);

    const { data, error } = await run(supabase, user.id, rawId);
    if (error) return failure(messages.failed);
    if (!data || data.length === 0) {
      // Làm mới để dòng đã bị xoá ở nơi khác biến khỏi danh sách.
      revalidatePath("/");
      return failure(
        "Không thể hoàn tất thao tác. Công việc có thể đã bị xoá hoặc bạn chưa có quyền thực hiện.",
      );
    }
  } catch {
    return failure(messages.failed);
  }

  revalidatePath("/");
  return { ok: true };
}

// user_id không lấy từ form. Lọc thêm theo user_id là lớp chặn thứ hai, lớp
// chính là RLS.
export async function setTodoDone(
  formData: FormData,
): Promise<TodoActionResult> {
  if (!isFormData(formData)) return failure(INVALID_REQUEST);
  const done = formData.get("is_done");
  if (done !== "true" && done !== "false") {
    return failure("Trạng thái công việc không hợp lệ.");
  }
  return mutateTodo(
    formData.get("id"),
    {
      login: "Bạn cần đăng nhập để cập nhật công việc.",
      failed: "Không thể cập nhật công việc. Vui lòng thử lại.",
    },
    (supabase, userId, id) =>
      supabase
        .from("todos")
        .update({ is_done: done === "true" })
        .eq("id", id)
        .eq("user_id", userId)
        .select("id"),
  );
}

export async function updateTodoTitle(
  formData: FormData,
): Promise<TodoActionResult> {
  if (!isFormData(formData)) return failure(INVALID_REQUEST);
  const validation = validateTitle(formData.get("title"));
  if (!validation.ok) return failure(validation.error);
  return mutateTodo(
    formData.get("id"),
    {
      login: "Bạn cần đăng nhập để sửa công việc.",
      failed: "Không thể sửa công việc. Vui lòng thử lại.",
    },
    (supabase, userId, id) =>
      supabase
        .from("todos")
        .update({ title: validation.title })
        .eq("id", id)
        .eq("user_id", userId)
        .select("id"),
  );
}

export async function deleteTodo(formData: FormData): Promise<TodoActionResult> {
  if (!isFormData(formData)) return failure(INVALID_REQUEST);
  return mutateTodo(
    formData.get("id"),
    {
      login: "Bạn cần đăng nhập để xoá công việc.",
      failed: "Không thể xoá công việc. Vui lòng thử lại.",
    },
    (supabase, userId, id) =>
      supabase
        .from("todos")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id"),
  );
}

export async function updateTodoDetails(
  formData: FormData,
): Promise<TodoActionResult> {
  if (!isFormData(formData)) return failure(INVALID_REQUEST);
  const rawId = formData.get("id");
  if (!isUuid(rawId)) return failure("Công việc không hợp lệ.");

  const titleValidation = validateTitle(formData.get("title"));
  if (!titleValidation.ok) return failure(titleValidation.error);

  const dueValidation = validateDueAt(formData.get("due_at"));
  if (!dueValidation.ok) return failure(dueValidation.error);

  const hasContentField = formData.has("content");
  const hasAttachmentsField = formData.has("attachments");
  const hasRepeatField = formData.has("repeat_rule");
  const safeContent = hasContentField
    ? sanitizeNoteHtml(formData.get("content"))
    : undefined;
  const attachValidation = hasAttachmentsField
    ? validateAttachmentsPayload(formData.get("attachments"))
    : null;
  if (attachValidation && !attachValidation.ok) {
    return failure(attachValidation.error);
  }
  const repeatValidation = hasRepeatField
    ? validateRepeatRule(formData.get("repeat_rule"))
    : null;
  if (repeatValidation && !repeatValidation.ok) {
    return failure(repeatValidation.error);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return failure("Bạn cần đăng nhập để cập nhật công việc.");

    const { data: existing } = await supabase
      .from("todos")
      .select("google_event_id")
      .eq("id", rawId)
      .eq("user_id", user.id)
      .maybeSingle<{ google_event_id: string | null }>();

    const updateFields: {
      title: string;
      due_at: string | null;
      content?: string;
      attachments?: NoteAttachment[];
      repeat_rule?: RepeatRule | null;
      google_event_id?: null;
      google_event_link?: null;
    } = {
      title: titleValidation.title,
      due_at: dueValidation.dueAt,
    };

    if (safeContent !== undefined) {
      updateFields.content = safeContent;
    }
    if (attachValidation && attachValidation.ok) {
      updateFields.attachments = attachValidation.attachments;
    }
    if (repeatValidation && repeatValidation.ok) {
      updateFields.repeat_rule = repeatValidation.repeatRule;
    }

    if (!dueValidation.dueAt) {
      updateFields.google_event_id = null;
      updateFields.google_event_link = null;
    }

    const { data, error } = await supabase
      .from("todos")
      .update(updateFields)
      .eq("id", rawId)
      .eq("user_id", user.id)
      .select("id");

    if (error) return failure("Không thể cập nhật chi tiết công việc.");
    if (!data || data.length === 0) {
      revalidatePath("/");
      return failure(
        "Không thể hoàn tất thao tác. Công việc có thể đã bị xoá hoặc bạn chưa có quyền thực hiện.",
      );
    }

    if (dueValidation.dueAt) {
      await syncTodosWithGoogleCalendar(supabase, user.id, rawId);
    } else if (existing?.google_event_id) {
      await removeTodoFromGoogleCalendarIfLinked(
        supabase,
        user.id,
        existing.google_event_id,
      );
    }
  } catch {
    return failure("Không thể cập nhật chi tiết công việc.");
  }

  revalidatePath("/");
  return { ok: true };
}

export async function enableDemoGoogleCalendar(): Promise<GoogleCalendarSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Bạn cần đăng nhập để liên kết." };
    }

    const { error } = await supabase
      .from("google_calendar_connections")
      .upsert(
        {
          user_id: user.id,
          enabled: true,
          mode: "demo",
          google_email: user.email ?? null,
          access_token: null,
          refresh_token: null,
          expires_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      return {
        ok: false,
        error: "Không thể lưu trạng thái liên kết Google Calendar.",
      };
    }

    const syncResult = await syncTodosWithGoogleCalendar(supabase, user.id);
    revalidatePath("/");
    return {
      ok: true,
      syncedCount: syncResult.syncedCount,
      mode: "demo",
    };
  } catch {
    return {
      ok: false,
      error: "Không thể liên kết Google Calendar. Vui lòng thử lại.",
    };
  }
}

export async function disconnectGoogleCalendar(): Promise<TodoActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return failure("Bạn cần đăng nhập để thay đổi cài đặt.");
    }

    const { error } = await supabase
      .from("google_calendar_connections")
      .upsert(
        {
          user_id: user.id,
          enabled: false,
          access_token: null,
          refresh_token: null,
          expires_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      return failure("Không thể ngắt liên kết Google Calendar.");
    }
  } catch {
    return failure("Không thể ngắt liên kết Google Calendar.");
  }

  revalidatePath("/");
  return { ok: true };
}

export async function syncGoogleCalendarNow(): Promise<GoogleCalendarSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Bạn cần đăng nhập để đồng bộ." };
    }

    const result = await syncTodosWithGoogleCalendar(supabase, user.id);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error ?? "Không thể đồng bộ Google Calendar.",
      };
    }
    revalidatePath("/");
    return {
      ok: true,
      syncedCount: result.syncedCount,
      mode: result.mode,
    };
  } catch {
    return { ok: false, error: "Không thể đồng bộ Google Calendar." };
  }
}
