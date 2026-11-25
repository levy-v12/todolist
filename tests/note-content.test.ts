import { describe, expect, it } from "vitest";
import {
  MAX_NOTE_ATTACHMENT_BYTES,
  extractPlainTextFromHtml,
  isAllowedImageFile,
  sanitizeNoteHtml,
  validateAttachmentBatch,
  validateAttachmentsPayload,
} from "@/lib/note-content";

describe("note-content helpers", () => {
  it("chấp nhận các định dạng ảnh jpg, jpeg, png, raw, heic, svg, gif và từ chối định dạng khác", () => {
    for (const name of [
      "a.jpg",
      "b.JPEG",
      "c.png",
      "d.raw",
      "e.heic",
      "f.svg",
      "g.gif",
    ]) {
      expect(isAllowedImageFile(name)).toBe(true);
    }
    expect(isAllowedImageFile("doc.pdf", "application/pdf")).toBe(false);
    expect(isAllowedImageFile("img.webp", "image/webp")).toBe(false);
  });

  it("validateAttachmentBatch giới hạn tổng dung lượng không quá 20 MB trong 1 note", () => {
    const exactLimit = validateAttachmentBatch(10 * 1024 * 1024, [
      { name: "photo.png", size: 10 * 1024 * 1024, type: "image/png" },
    ]);
    expect(exactLimit).toEqual({
      ok: true,
      totalBytes: MAX_NOTE_ATTACHMENT_BYTES,
    });

    const overLimit = validateAttachmentBatch(10 * 1024 * 1024, [
      { name: "photo.raw", size: 10 * 1024 * 1024 + 1, type: "" },
    ]);
    expect(overLimit).toMatchObject({ ok: false });
  });

  it("validateAttachmentsPayload từ chối path không an toàn hoặc vượt quá 20 MB", () => {
    const valid = validateAttachmentsPayload(
      JSON.stringify([
        {
          id: "att-1",
          name: "anh.heic",
          size: 1024,
          ext: "heic",
          mimeType: "image/heic",
          path: "user-1/att-1.heic",
          url: "/api/note-attachments?path=user-1%2Fatt-1.heic",
        },
      ]),
    );
    expect(valid.ok).toBe(true);

    const traversal = validateAttachmentsPayload(
      JSON.stringify([
        {
          id: "att-2",
          name: "bad.png",
          size: 100,
          ext: "png",
          mimeType: "image/png",
          path: "../secret.png",
          url: "/api/note-attachments?path=..%2Fsecret.png",
        },
      ]),
    );
    expect(traversal.ok).toBe(false);
  });

  it("sanitizeNoteHtml giữ lại typography/style hợp lệ và loại bỏ mã độc", () => {
    const dirty =
      '<h1 style="text-align: center; text-transform: uppercase;">Tiêu đề</h1>' +
      '<p onclick="alert(1)"><span style="font-size: 18px; font-family: Georgia, serif; color: #1d4ed8">Nội dung</span></p>' +
      '<script>alert("xss")</script><iframe src="https://evil.test"></iframe>';

    const clean = sanitizeNoteHtml(dirty);
    expect(clean).toContain('<h1 style="text-align:center;text-transform:uppercase">Tiêu đề</h1>');
    expect(clean).toContain('<span style="font-size:18px;font-family:Georgia, serif;color:#1d4ed8">Nội dung</span>');
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("onclick");
  });

  it("extractPlainTextFromHtml trích xuất văn bản thuần sạch", () => {
    expect(
      extractPlainTextFromHtml("<h2>Xin chào</h2><p>Ghi chú <strong>mới</strong></p>"),
    ).toBe("Xin chào Ghi chú mới");
  });
});
