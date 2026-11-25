export const MAX_NOTE_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_NOTE_CONTENT_LENGTH = 100_000;

export const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "raw",
  "heic",
  "svg",
  "gif",
  "mp4",
  "mp3",
  "wav",
] as const;

export type AllowedImageExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];

export const IMAGE_ACCEPT_ATTRIBUTE =
  ".jpg,.jpeg,.png,.raw,.heic,.svg,.gif,.mp4,.mp3,.wav,image/jpeg,image/png,image/gif,image/svg+xml,image/heic,image/heif,video/mp4,audio/mpeg,audio/wav";

const ALLOWED_MIME_MAP: Record<AllowedImageExtension, string[]> = {
  jpg: ["image/jpeg", "image/jpg", ""],
  jpeg: ["image/jpeg", "image/jpg", ""],
  png: ["image/png", ""],
  raw: [
    "image/x-raw",
    "image/x-panasonic-raw",
    "image/x-canon-cr2",
    "image/x-nikon-nef",
    "image/x-sony-arw",
    "image/x-adobe-dng",
    "application/octet-stream",
    "",
  ],
  heic: ["image/heic", "image/heif", "application/octet-stream", ""],
  svg: ["image/svg+xml", "text/xml", ""],
  gif: ["image/gif", ""],
  mp4: ["video/mp4", "application/mp4", "application/octet-stream", ""],
  mp3: ["audio/mpeg", "audio/mp3", "application/octet-stream", ""],
  wav: [
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/vnd.wave",
    "application/octet-stream",
    "",
  ],
};

export type NoteAttachment = {
  id: string;
  name: string;
  size: number;
  ext: AllowedImageExtension;
  mimeType: string;
  path: string;
  url: string;
};

export const FONT_SIZE_OPTIONS = [
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "28px", value: "28px" },
  { label: "32px", value: "32px" },
] as const;

export const FONT_FAMILY_OPTIONS = [
  {
    label: "Mặc định (Sans)",
    value: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    label: "Serif (Cổ điển)",
    value: 'Georgia, Cambria, "Times New Roman", serif',
  },
  {
    label: "Monospace (Code)",
    value: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  {
    label: "Trebuchet (Hiện đại)",
    value: '"Trebuchet MS", Verdana, sans-serif',
  },
  {
    label: "Palatino (Báo chí)",
    value: '"Palatino Linotype", "Book Antiqua", serif',
  },
] as const;

export const TEXT_COLOR_OPTIONS = [
  { label: "Đen xám", value: "#0f172a" },
  { label: "Xanh dương", value: "#1d4ed8" },
  { label: "Xanh ngọc", value: "#047857" },
  { label: "Đỏ", value: "#b91c1c" },
  { label: "Cam", value: "#c2410c" },
  { label: "Tím", value: "#6d28d9" },
] as const;

export const HIGHLIGHT_COLOR_OPTIONS = [
  { label: "Không tô nền", value: "transparent" },
  { label: "Vàng nhạt", value: "#fef08a" },
  { label: "Xanh nhạt", value: "#dbeafe" },
  { label: "Lá nhạt", value: "#dcfce7" },
  { label: "Hồng nhạt", value: "#fce7f3" },
] as const;

export const EDITOR_SHORTCUTS = [
  { keys: "Ctrl/Cmd + B", action: "In đậm" },
  { keys: "Ctrl/Cmd + I", action: "In nghiêng" },
  { keys: "Ctrl/Cmd + U", action: "Gạch chân" },
  { keys: "Ctrl/Cmd + Shift + X", action: "Gạch ngang" },
  { keys: "Ctrl/Cmd + Alt + 1 / 2 / 3", action: "Tiêu đề H1 / H2 / H3" },
  { keys: "Ctrl/Cmd + Alt + 0", action: "Đoạn văn thường" },
  { keys: "Ctrl/Cmd + Shift + 7 / 8", action: "Danh sách số / chấm" },
  { keys: "Ctrl/Cmd + Shift + L / E / R / J", action: "Căn trái / giữa / phải / đều" },
  { keys: "Ctrl/Cmd + \\", action: "Xoá định dạng" },
  { keys: "Ctrl/Cmd + Z / Y", action: "Hoàn tác / Làm lại" },
  { keys: "Ctrl/Cmd + Enter", action: "Lưu note nhanh" },
  { keys: "# , ## , - , 1. , > + Space", action: "Markdown đầu dòng" },
] as const;

export function getFileExtension(filename: string): string {
  const parts = filename.trim().toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isAllowedImageExtension(
  ext: string,
): ext is AllowedImageExtension {
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAllowedImageFile(
  filename: string,
  mimeType: string = "",
): boolean {
  const ext = getFileExtension(filename);
  if (!isAllowedImageExtension(ext)) return false;
  const normalizedMime = mimeType.trim().toLowerCase();
  if (!normalizedMime) return true;
  return ALLOWED_MIME_MAP[ext].includes(normalizedMime);
}

export function isInlinePreviewableExtension(ext: string): boolean {
  return ["jpg", "jpeg", "png", "svg", "gif"].includes(ext.toLowerCase());
}

export function getAttachmentKind(
  ext: string,
): "image" | "video" | "audio" | "file" {
  const lower = ext.toLowerCase();
  if (isInlinePreviewableExtension(lower)) return "image";
  if (lower === "mp4") return "video";
  if (lower === "mp3" || lower === "wav") return "audio";
  return "file";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateAttachmentBatch(
  existingTotalBytes: number,
  files: { name: string; size: number; type?: string }[],
): { ok: true; totalBytes: number } | { ok: false; error: string } {
  let runningTotal = Math.max(0, existingTotalBytes);
  for (const file of files) {
    if (!isAllowedImageFile(file.name, file.type ?? "")) {
      return {
        ok: false,
        error: `Tệp "${file.name}" không đúng định dạng. Chỉ hỗ trợ: ${ALLOWED_IMAGE_EXTENSIONS.join(", ").toUpperCase()}.`,
      };
    }
    if (file.size < 0) {
      return { ok: false, error: `Kích thước tệp "${file.name}" không hợp lệ.` };
    }
    runningTotal += file.size;
    if (runningTotal > MAX_NOTE_ATTACHMENT_BYTES) {
      return {
        ok: false,
        error: "Tổng dung lượng tệp đính kèm trong 1 note không được vượt quá 20 MB.",
      };
    }
  }
  return { ok: true, totalBytes: runningTotal };
}

export function validateAttachmentsPayload(
  raw: unknown,
): { ok: true; attachments: NoteAttachment[] } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, attachments: [] };
  }
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Danh sách ảnh đính kèm không hợp lệ." };
    }
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Danh sách ảnh đính kèm không hợp lệ." };
  }

  const sanitized: NoteAttachment[] = [];
  let totalBytes = 0;

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Dữ liệu ảnh đính kèm không hợp lệ." };
    }
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const name =
      typeof candidate.name === "string" ? candidate.name.trim() : "";
    const size =
      typeof candidate.size === "number" && Number.isFinite(candidate.size)
        ? candidate.size
        : -1;
    const ext =
      typeof candidate.ext === "string" ? candidate.ext.toLowerCase() : "";
    const mimeType =
      typeof candidate.mimeType === "string" ? candidate.mimeType : "";
    const path =
      typeof candidate.path === "string" ? candidate.path.trim() : "";
    const url = typeof candidate.url === "string" ? candidate.url.trim() : "";

    if (
      !id ||
      !name ||
      size < 0 ||
      !isAllowedImageExtension(ext) ||
      !path ||
      path.includes("..") ||
      !url.startsWith("/api/note-attachments?")
    ) {
      return { ok: false, error: "Thông tin ảnh đính kèm không hợp lệ." };
    }

    totalBytes += size;
    if (totalBytes > MAX_NOTE_ATTACHMENT_BYTES) {
      return {
        ok: false,
        error: "Tổng dung lượng ảnh trong 1 note không được vượt quá 20 MB.",
      };
    }

    sanitized.push({ id, name, size, ext, mimeType, path, url });
  }

  return { ok: true, attachments: sanitized };
}

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "pre",
  "code",
  "ul",
  "ol",
  "li",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "span",
]);

const SAFE_ALIGN = new Set(["left", "center", "right", "justify"]);
const SAFE_TRANSFORM = new Set([
  "uppercase",
  "lowercase",
  "capitalize",
  "none",
]);

function sanitizeStyleAttribute(rawStyle: string): string {
  const safeParts: string[] = [];
  for (const declaration of rawStyle.split(";")) {
    const colonIdx = declaration.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = declaration.slice(0, colonIdx).trim().toLowerCase();
    const val = declaration.slice(colonIdx + 1).trim();
    if (!val || /expression|url\s*\(|javascript:|@/i.test(val)) continue;

    if (prop === "text-align" && SAFE_ALIGN.has(val.toLowerCase())) {
      safeParts.push(`text-align:${val.toLowerCase()}`);
    } else if (
      prop === "text-transform" &&
      SAFE_TRANSFORM.has(val.toLowerCase())
    ) {
      safeParts.push(`text-transform:${val.toLowerCase()}`);
    } else if (prop === "font-size") {
      const match = /^(\d{1,2})px$/i.exec(val);
      if (match) {
        const px = Number(match[1]);
        if (px >= 10 && px <= 48) safeParts.push(`font-size:${px}px`);
      }
    } else if (prop === "font-family") {
      if (/^[a-zA-Z0-9\s,"'-]+$/.test(val) && val.length <= 120) {
        safeParts.push(`font-family:${val}`);
      }
    } else if (prop === "color" || prop === "background-color") {
      if (
        val.toLowerCase() === "transparent" ||
        /^#[0-9a-f]{3,8}$/i.test(val) ||
        /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(
          val,
        )
      ) {
        safeParts.push(`${prop}:${val}`);
      }
    }
  }
  return safeParts.join(";");
}

// Làm sạch HTML nội dung note ở cả phía client và server, loại bỏ mọi script/handler.
export function sanitizeNoteHtml(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().slice(0, MAX_NOTE_CONTENT_LENGTH);
  if (!trimmed) return "";

  // Loại bỏ hoàn toàn thẻ nguy hiểm và nội dung bên trong chúng.
  const withoutDangerousBlocks = trimmed
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|svg|math|form|input|textarea|button)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|svg|math|form|input|textarea|button)\b[^>]*\/?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  return withoutDangerousBlocks.replace(
    /<(\/?)([a-zA-Z0-9-]+)([^>]*)>/g,
    (_full, slash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        return "";
      }
      if (slash === "/") {
        if (tag === "br" || tag === "hr") return "";
        return `</${tag}>`;
      }

      const styleMatch =
        /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs);
      const safeStyle = styleMatch
        ? sanitizeStyleAttribute(styleMatch[1] ?? styleMatch[2] ?? "")
        : "";

      const selfClose = tag === "br" || tag === "hr" ? " /" : "";
      const styleAttr = safeStyle ? ` style="${safeStyle}"` : "";
      return `<${tag}${styleAttr}${selfClose}>`;
    },
  );
}

export function extractPlainTextFromHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|li|blockquote|pre)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
