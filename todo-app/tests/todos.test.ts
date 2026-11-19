import { describe, expect, it } from "vitest";
import { validateTitle } from "@/lib/todos";

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
