"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  EDITOR_SHORTCUTS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  HIGHLIGHT_COLOR_OPTIONS,
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_NOTE_ATTACHMENT_BYTES,
  TEXT_COLOR_OPTIONS,
  formatFileSize,
  isInlinePreviewableExtension,
  sanitizeNoteHtml,
  validateAttachmentBatch,
  type NoteAttachment,
} from "@/lib/note-content";
import { ExternalLinkIcon, XIcon } from "./icons";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const toolBtnClass = `inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`;
const selectClass = `h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 ${focusRing}`;

const EDITOR_PROSE_CLASS =
  "min-h-48 w-full flex-1 overflow-y-auto rounded-b-xl bg-white p-4 text-sm leading-relaxed text-slate-900 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-50/50 [&_blockquote]:py-1 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_h1]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:my-1 [&_h4]:text-base [&_h4]:font-semibold [&_hr]:my-3 [&_hr]:border-slate-200 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:text-slate-100 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6";

export function NoteRichEditor({
  initialHtml = "",
  initialAttachments = [],
  onChangeHtml,
  onChangeAttachments,
  onQuickSubmit,
  disabled = false,
}: {
  initialHtml?: string;
  initialAttachments?: NoteAttachment[];
  onChangeHtml: (html: string) => void;
  onChangeAttachments: (attachments: NoteAttachment[]) => void;
  onQuickSubmit?: () => void;
  disabled?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [attachments, setAttachments] =
    useState<NoteAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const totalBytes = useMemo(
    () => attachments.reduce((sum, item) => sum + item.size, 0),
    [attachments],
  );
  const quotaPercent = Math.min(
    100,
    Math.round((totalBytes / MAX_NOTE_ATTACHMENT_BYTES) * 100),
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeNoteHtml(initialHtml);
    }
  }, [initialHtml]);

  function saveSelection() {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  }

  function emitHtml() {
    if (!editorRef.current) return;
    const cleaned = sanitizeNoteHtml(editorRef.current.innerHTML);
    onChangeHtml(cleaned);
  }

  function runCommand(command: string, value?: string) {
    if (disabled) return;
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    emitHtml();
  }

  function applyInlineCss(
    property: "fontSize" | "fontFamily" | "textTransform",
    value: string,
  ) {
    if (disabled) return;
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      // Nếu chưa bôi đen: áp dụng vào khối hiện tại hoặc tạo span cho văn bản sắp gõ.
      let node: Node | null = range.startContainer;
      while (node && node !== editorRef.current && node.nodeType !== 1) {
        node = node.parentNode;
      }
      if (
        node &&
        node instanceof HTMLElement &&
        node !== editorRef.current &&
        ["P", "H1", "H2", "H3", "H4", "DIV", "LI", "BLOCKQUOTE", "SPAN"].includes(
          node.tagName,
        )
      ) {
        node.style[property] = value;
      } else {
        const span = document.createElement("span");
        span.style[property] = value;
        span.textContent = "\u200B";
        range.insertNode(span);
        const nextRange = document.createRange();
        nextRange.setStart(span.firstChild ?? span, 1);
        nextRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      }
    } else {
      const span = document.createElement("span");
      span.style[property] = value;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      } catch {
        // Fallback nếu vùng chọn cắt qua nhiều block phức tạp.
        const text = range.toString();
        span.textContent = text;
        range.deleteContents();
        range.insertNode(span);
      }
    }

    saveSelection();
    emitHtml();
  }

  function handleMarkdownShortcutOnSpace(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== " ") return false;
    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed || selection.rangeCount === 0) {
      return false;
    }
    const anchor = selection.anchorNode;
    if (!anchor || anchor.nodeType !== Node.TEXT_NODE) return false;
    const textBefore = (anchor.textContent ?? "").slice(0, selection.anchorOffset);

    const blockShortcutMap: Record<string, { cmd: string; val?: string }> = {
      "#": { cmd: "formatBlock", val: "h1" },
      "##": { cmd: "formatBlock", val: "h2" },
      "###": { cmd: "formatBlock", val: "h3" },
      "####": { cmd: "formatBlock", val: "h4" },
      ">": { cmd: "formatBlock", val: "blockquote" },
      "-": { cmd: "insertUnorderedList" },
      "*": { cmd: "insertUnorderedList" },
      "1.": { cmd: "insertOrderedList" },
    };

    const match = blockShortcutMap[textBefore];
    if (!match) return false;

    event.preventDefault();
    const range = selection.getRangeAt(0);
    range.setStart(anchor, 0);
    range.setEnd(anchor, selection.anchorOffset);
    range.deleteContents();
    document.execCommand(match.cmd, false, match.val);
    saveSelection();
    emitHtml();
    return true;
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (handleMarkdownShortcutOnSpace(event)) return;

    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;

    const key = event.key.toLowerCase();

    if (key === "enter" && onQuickSubmit) {
      event.preventDefault();
      emitHtml();
      onQuickSubmit();
      return;
    }

    if (!event.shiftKey && !event.altKey) {
      if (key === "b") {
        event.preventDefault();
        runCommand("bold");
      } else if (key === "i") {
        event.preventDefault();
        runCommand("italic");
      } else if (key === "u") {
        event.preventDefault();
        runCommand("underline");
      } else if (key === "\\") {
        event.preventDefault();
        runCommand("removeFormat");
      }
      return;
    }

    if (event.shiftKey && !event.altKey) {
      if (key === "x") {
        event.preventDefault();
        runCommand("strikeThrough");
      } else if (key === "7") {
        event.preventDefault();
        runCommand("insertOrderedList");
      } else if (key === "8") {
        event.preventDefault();
        runCommand("insertUnorderedList");
      } else if (key === "l") {
        event.preventDefault();
        runCommand("justifyLeft");
      } else if (key === "e") {
        event.preventDefault();
        runCommand("justifyCenter");
      } else if (key === "r") {
        event.preventDefault();
        runCommand("justifyRight");
      } else if (key === "j") {
        event.preventDefault();
        runCommand("justifyFull");
      }
      return;
    }

    if (event.altKey && !event.shiftKey) {
      if (key === "0") {
        event.preventDefault();
        runCommand("formatBlock", "p");
      } else if (key === "1") {
        event.preventDefault();
        runCommand("formatBlock", "h1");
      } else if (key === "2") {
        event.preventDefault();
        runCommand("formatBlock", "h2");
      } else if (key === "3") {
        event.preventDefault();
        runCommand("formatBlock", "h3");
      }
    }
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || disabled) return;
    setAttachError(null);

    const files = Array.from(fileList);
    const check = validateAttachmentBatch(
      totalBytes,
      files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    );
    if (!check.ok) {
      setAttachError(check.error);
      return;
    }

    const body = new FormData();
    body.set("existingSize", String(totalBytes));
    for (const file of files) {
      body.append("files", file);
    }

    setUploading(true);
    try {
      const response = await fetch("/api/note-attachments", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        attachments?: NoteAttachment[];
        error?: string;
      };
      if (!response.ok || !data.attachments) {
        setAttachError(data.error ?? "Không thể tải ảnh lên. Vui lòng thử lại.");
        return;
      }
      const next = [...attachments, ...data.attachments];
      setAttachments(next);
      onChangeAttachments(next);
    } catch {
      setAttachError("Không thể kết nối máy chủ để tải ảnh lên.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveAttachment(item: NoteAttachment) {
    if (disabled) return;
    setAttachError(null);
    const next = attachments.filter((att) => att.id !== item.id);
    setAttachments(next);
    onChangeAttachments(next);
    try {
      await fetch(
        `/api/note-attachments?path=${encodeURIComponent(item.path)}`,
        { method: "DELETE" },
      );
    } catch {
      // Giữ trạng thái UI đã gỡ khỏi note.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs">
        <div
          role="toolbar"
          aria-label="Thanh công cụ định dạng nội dung note"
          className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2"
        >
          {/* Heading & Typography block */}
          <select
            aria-label="Kiểu khối & Heading"
            defaultValue="p"
            disabled={disabled}
            onChange={(event) => {
              runCommand("formatBlock", event.target.value);
            }}
            className={selectClass}
          >
            <option value="p">Đoạn văn (P)</option>
            <option value="h1">Tiêu đề 1 (H1)</option>
            <option value="h2">Tiêu đề 2 (H2)</option>
            <option value="h3">Tiêu đề 3 (H3)</option>
            <option value="h4">Tiêu đề 4 (H4)</option>
            <option value="blockquote">Trích dẫn</option>
            <option value="pre">Khối mã (Code)</option>
          </select>

          {/* Font family */}
          <select
            aria-label="Kiểu chữ"
            defaultValue={FONT_FAMILY_OPTIONS[0].value}
            disabled={disabled}
            onChange={(event) =>
              applyInlineCss("fontFamily", event.target.value)
            }
            className={selectClass}
          >
            {FONT_FAMILY_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Font size */}
          <select
            aria-label="Cỡ chữ"
            defaultValue="14px"
            disabled={disabled}
            onChange={(event) => applyInlineCss("fontSize", event.target.value)}
            className={selectClass}
          >
            {FONT_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Text Transform */}
          <select
            aria-label="Biến đổi chữ (Transform)"
            defaultValue="none"
            disabled={disabled}
            onChange={(event) =>
              applyInlineCss("textTransform", event.target.value)
            }
            className={selectClass}
          >
            <option value="none">Transform: Mặc định</option>
            <option value="uppercase">CHỮ HOA</option>
            <option value="lowercase">chữ thường</option>
            <option value="capitalize">Viết Hoa Đầu Từ</option>
          </select>

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          {/* Style buttons */}
          <button
            type="button"
            title="In đậm (Ctrl+B)"
            aria-label="In đậm"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("bold")}
            className={`${toolBtnClass} font-bold`}
          >
            B
          </button>
          <button
            type="button"
            title="In nghiêng (Ctrl+I)"
            aria-label="In nghiêng"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("italic")}
            className={`${toolBtnClass} italic`}
          >
            I
          </button>
          <button
            type="button"
            title="Gạch chân (Ctrl+U)"
            aria-label="Gạch chân"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("underline")}
            className={`${toolBtnClass} underline`}
          >
            U
          </button>
          <button
            type="button"
            title="Gạch ngang (Ctrl+Shift+X)"
            aria-label="Gạch ngang"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("strikeThrough")}
            className={`${toolBtnClass} line-through`}
          >
            S
          </button>

          {/* Colors */}
          <select
            aria-label="Màu chữ"
            defaultValue="#0f172a"
            disabled={disabled}
            onChange={(event) => runCommand("foreColor", event.target.value)}
            className={selectClass}
          >
            {TEXT_COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Chữ: {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Màu nền chữ"
            defaultValue="transparent"
            disabled={disabled}
            onChange={(event) => runCommand("hiliteColor", event.target.value)}
            className={selectClass}
          >
            {HIGHLIGHT_COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Nền: {opt.label}
              </option>
            ))}
          </select>

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          {/* Alignment */}
          <button
            type="button"
            title="Căn trái (Ctrl+Shift+L)"
            aria-label="Căn trái"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("justifyLeft")}
            className={toolBtnClass}
          >
            Trái
          </button>
          <button
            type="button"
            title="Căn giữa (Ctrl+Shift+E)"
            aria-label="Căn giữa"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("justifyCenter")}
            className={toolBtnClass}
          >
            Giữa
          </button>
          <button
            type="button"
            title="Căn phải (Ctrl+Shift+R)"
            aria-label="Căn phải"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("justifyRight")}
            className={toolBtnClass}
          >
            Phải
          </button>
          <button
            type="button"
            title="Căn đều (Ctrl+Shift+J)"
            aria-label="Căn đều"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("justifyFull")}
            className={toolBtnClass}
          >
            Đều
          </button>

          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden="true" />

          {/* Lists, HR, Clear, Undo/Redo */}
          <button
            type="button"
            title="Danh sách chấm (Ctrl+Shift+8)"
            aria-label="Danh sách chấm"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("insertUnorderedList")}
            className={toolBtnClass}
          >
            • List
          </button>
          <button
            type="button"
            title="Danh sách số (Ctrl+Shift+7)"
            aria-label="Danh sách số"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("insertOrderedList")}
            className={toolBtnClass}
          >
            1. List
          </button>
          <button
            type="button"
            title="Đường kẻ ngang"
            aria-label="Chèn đường kẻ ngang"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("insertHorizontalRule")}
            className={toolBtnClass}
          >
            ―
          </button>
          <button
            type="button"
            title="Xoá định dạng (Ctrl+\)"
            aria-label="Xoá định dạng"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("removeFormat")}
            className={toolBtnClass}
          >
            Xoá style
          </button>
          <button
            type="button"
            title="Hoàn tác (Ctrl+Z)"
            aria-label="Hoàn tác"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("undo")}
            className={toolBtnClass}
          >
            ↶
          </button>
          <button
            type="button"
            title="Làm lại (Ctrl+Y)"
            aria-label="Làm lại"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand("redo")}
            className={toolBtnClass}
          >
            ↷
          </button>

          <button
            type="button"
            onClick={() => setShowShortcuts((prev) => !prev)}
            aria-expanded={showShortcuts}
            className={`ml-auto ${toolBtnClass} ${
              showShortcuts ? "border-blue-300 bg-blue-50 text-blue-700" : ""
            }`}
          >
            Phím tắt
          </button>
        </div>

        {showShortcuts ? (
          <div className="grid grid-cols-1 gap-1.5 border-b border-slate-200 bg-blue-50/50 p-3 text-xs sm:grid-cols-2">
            {EDITOR_SHORTCUTS.map((item) => (
              <div
                key={item.keys}
                className="flex items-center justify-between gap-2 rounded bg-white/90 px-2 py-1"
              >
                <span className="text-slate-700">{item.action}</span>
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800">
                  {item.keys}
                </kbd>
              </div>
            ))}
          </div>
        ) : null}

        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Nội dung chi tiết note"
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder="Viết nội dung chi tiết cho note... (Hỗ trợ Ctrl+B/I/U, # Heading, - List, > Trích dẫn)"
          onInput={emitHtml}
          onBlur={() => {
            saveSelection();
            emitHtml();
          }}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onKeyDown={handleEditorKeyDown}
          className={EDITOR_PROSE_CLASS}
        />
      </div>

      {/* Khu vực thêm ảnh đính kèm (tối đa 20 MB / 1 note) */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFilesSelected(event.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed p-3 transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50/70"
            : "border-slate-300 bg-slate-50/70"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Ảnh đính kèm ({attachments.length})
            </p>
            <p className="text-[11px] text-slate-500">
              Định dạng: {ALLOWED_IMAGE_EXTENSIONS.join(", ").toUpperCase()} •
              Tối đa 20 MB / 1 note ({formatFileSize(totalBytes)} / 20.00 MB)
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              disabled={disabled || uploading}
              onChange={(event) => void handleFilesSelected(event.target.files)}
              className="sr-only"
              id="note-image-upload"
            />
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {uploading ? "Đang tải ảnh..." : "+ Thêm ảnh"}
            </button>
          </div>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              quotaPercent >= 90 ? "bg-amber-500" : "bg-blue-600"
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>

        {attachError ? (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {attachError}
          </p>
        ) : null}

        {attachments.length > 0 ? (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {attachments.map((item) => {
              const previewable = isInlinePreviewableExtension(item.ext);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2"
                >
                  {previewable ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.name}
                      className="size-12 shrink-0 rounded-md border border-slate-100 object-cover"
                    />
                  ) : (
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                      {item.ext}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.ext.toUpperCase()} • {formatFileSize(item.size)}
                    </p>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở ảnh ${item.name}`}
                    className={`inline-flex size-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleRemoveAttachment(item)}
                    aria-label={`Xoá ảnh ${item.name}`}
                    className={`inline-flex size-7 items-center justify-center rounded text-red-600 hover:bg-red-50 ${focusRing}`}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
