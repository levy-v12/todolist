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
