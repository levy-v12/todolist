export const TITLE_MAX_LENGTH = 200;

export type TitleValidation =
  | { ok: true; title: string }
  | { ok: false; error: string };

// Bỏ khoảng trắng hai đầu, chỉ nhận tiêu đề dài 1-200 ký tự.
export function validateTitle(input: unknown): TitleValidation {
  if (typeof input !== "string") {
    return { ok: false, error: "Vui lòng nhập tiêu đề công việc." };
  }
  const title = input.trim();
  if (title.length === 0) {
    return { ok: false, error: "Vui lòng nhập tiêu đề công việc." };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Tiêu đề không được dài quá ${TITLE_MAX_LENGTH} ký tự.`,
    };
  }
  return { ok: true, title };
}

export type DueAtValidation =
  | { ok: true; dueAt: string | null }
  | { ok: false; error: string };

// Ngày giờ hẹn là tuỳ chọn: rỗng thì trả về null, có giá trị thì chuẩn hoá ISO.
export function validateDueAt(input: unknown): DueAtValidation {
  if (input === null || input === undefined) {
    return { ok: true, dueAt: null };
  }
  if (typeof input !== "string") {
    return { ok: false, error: "Ngày giờ hẹn không hợp lệ." };
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: true, dueAt: null };
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, error: "Ngày giờ hẹn không hợp lệ." };
  }
  return { ok: true, dueAt: parsed.toISOString() };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// id lấy từ form không đáng tin: chỉ nhận chuỗi đúng dạng UUID.
export function isUuid(input: unknown): input is string {
  return typeof input === "string" && UUID_PATTERN.test(input);
}
