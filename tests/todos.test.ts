import { describe, expect, it } from "vitest";
import { validateDueAt, validateTitle } from "@/lib/todos";

describe("validateTitle", () => {
  it("từ chối chuỗi rỗng", () => {
    expect(validateTitle("")).toMatchObject({ ok: false });
  });

  it("từ chối chuỗi toàn khoảng trắng", () => {
    expect(validateTitle("   \t  ")).toMatchObject({ ok: false });
  });

  it("từ chối giá trị không phải chuỗi", () => {
    expect(validateTitle(null)).toMatchObject({ ok: false });
  });

  it("nhận tiêu đề dài đúng 200 ký tự", () => {
    const title = "a".repeat(200);
    expect(validateTitle(title)).toEqual({ ok: true, title });
  });

  it("từ chối tiêu đề dài 201 ký tự", () => {
    const result = validateTitle("a".repeat(201));
    expect(result.ok).toBe(false);
  });

  it("bỏ khoảng trắng hai đầu", () => {
    expect(validateTitle("  Mua sữa  ")).toEqual({
      ok: true,
      title: "Mua sữa",
    });
  });

  it("tính độ dài sau khi bỏ khoảng trắng hai đầu", () => {
    const title = "a".repeat(200);
    expect(validateTitle(`  ${title}  `)).toEqual({ ok: true, title });
  });
});

describe("validateDueAt", () => {
  it("cho phép rỗng hoặc null thành null", () => {
    expect(validateDueAt("")).toEqual({ ok: true, dueAt: null });
    expect(validateDueAt("   ")).toEqual({ ok: true, dueAt: null });
    expect(validateDueAt(null)).toEqual({ ok: true, dueAt: null });
  });

  it("chuẩn hoá chuỗi ngày giờ hợp lệ sang ISO", () => {
    const result = validateDueAt("2026-11-25T14:30:00.000Z");
    expect(result).toEqual({
      ok: true,
      dueAt: "2026-11-25T14:30:00.000Z",
    });
  });

  it("từ chối chuỗi ngày giờ không hợp lệ", () => {
    expect(validateDueAt("khong-phai-ngay")).toMatchObject({ ok: false });
  });
});
