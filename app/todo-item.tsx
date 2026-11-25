"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { extractPlainTextFromHtml } from "@/lib/note-content";
import { formatTodoDateTime, type TodoRecord } from "@/lib/todo-views";
import { deleteTodo, setTodoDone, updateTodoTitle } from "./actions";
import { CalendarIcon, ClockIcon } from "./icons";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const buttonBase = `rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${focusRing} disabled:cursor-not-allowed disabled:opacity-60`;

export function TodoItem({
  todo,
  variant = "list",
  onSelectTodo,
}: {
  todo: TodoRecord;
  variant?: "list" | "grid";
  onSelectTodo?: (todo: TodoRecord) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  // Chỉ true sau khi thoát chế độ sửa (Lưu/Huỷ): đưa focus về nút "Sửa".
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  function closeEditor() {
    restoreFocus.current = true;
    setEditing(false);
  }

  function run(
    action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>,
    fields: Record<string, string>,
    onSuccess?: () => void,
  ) {
    const formData = new FormData();
    formData.set("id", todo.id);
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value);
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.ok) onSuccess?.();
        else setError(result.error ?? "Có lỗi xảy ra. Vui lòng thử lại.");
      } catch {
        setError("Không thể kết nối. Vui lòng thử lại.");
      }
    });
  }

  const errorId = `todo-error-${todo.id}`;
  const errorEl = error ? (
    <p id={errorId} role="alert" className="text-xs text-red-700">
      {error}
    </p>
  ) : null;

  const isGrid = variant === "grid";
  const createdLabel = formatTodoDateTime(todo.created_at);
  const dueLabel = todo.due_at ? formatTodoDateTime(todo.due_at) : "";
  const contentExcerpt = extractPlainTextFromHtml(todo.content);
  const attachmentCount = Array.isArray(todo.attachments)
    ? todo.attachments.length
    : 0;

  const cardSurface = todo.is_done
    ? "border-emerald-200 bg-emerald-50/40"
    : "border-slate-200 bg-white hover:border-blue-300";

  const containerClass = isGrid
    ? `flex h-full flex-col justify-between gap-3 break-words rounded-xl border border-t-4 p-4 shadow-xs transition-colors ${
        todo.is_done ? "border-t-emerald-500" : "border-t-blue-600"
      } ${cardSurface}`
    : `flex flex-col gap-2 break-words rounded-xl border border-l-4 px-4 py-3 shadow-xs transition-colors ${
        todo.is_done ? "border-l-emerald-500" : "border-l-blue-600"
      } ${cardSurface}`;

  if (editing) {
    const inputId = `todo-title-${todo.id}`;
    return (
      <li className={containerClass}>
        <form
          className="flex flex-col gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            run(updateTodoTitle, { title: draft }, closeEditor);
          }}
        >
          <label
            htmlFor={inputId}
            className="text-xs font-semibold tracking-wide text-blue-700 uppercase"
          >
            Sửa tiêu đề note
          </label>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            readOnly={pending}
            aria-label={`Sửa tiêu đề: ${todo.title}`}
            autoComplete="off"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            className="block w-full min-w-0 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 read-only:opacity-60"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              aria-label={`Lưu: ${todo.title}`}
              className={`${buttonBase} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`}
            >
              {pending ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              disabled={pending}
              aria-label={`Huỷ: ${todo.title}`}
              onClick={() => {
                closeEditor();
                setDraft(todo.title);
                setError(null);
              }}
              className={`${buttonBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
            >
              Huỷ
            </button>
          </div>
          {errorEl}
        </form>
      </li>
    );
  }

  return (
    <li className={containerClass}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.is_done}
          disabled={pending}
          aria-label={`Đã xong: ${todo.title}`}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) =>
            run(setTodoDone, { is_done: String(event.target.checked) })
          }
          className={`mt-0.5 size-4 shrink-0 rounded accent-blue-600 ${focusRing} disabled:cursor-not-allowed`}
        />
        <div className="min-w-0 flex-1">
          {onSelectTodo ? (
            <button
              type="button"
              onClick={() => onSelectTodo(todo)}
              className={`block w-full rounded text-left text-sm leading-relaxed font-medium break-words hover:text-blue-700 ${focusRing} ${
                todo.is_done ? "text-slate-500 line-through" : "text-slate-900"
              }`}
            >
              {todo.title}
            </button>
          ) : (
            <p
              className={`text-sm leading-relaxed font-medium break-words ${
                todo.is_done ? "text-slate-500 line-through" : "text-slate-900"
              }`}
            >
              {todo.title}
            </p>
          )}

          {contentExcerpt ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600">
              {contentExcerpt}
            </p>
          ) : null}

          {dueLabel || todo.google_event_id || attachmentCount > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {dueLabel ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  <ClockIcon className="size-3" />
                  <span>Hẹn: {dueLabel}</span>
                </span>
              ) : null}
              {attachmentCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                  <span>{attachmentCount} ảnh</span>
                </span>
              ) : null}
              {todo.google_event_id ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <CalendarIcon className="size-3" />
                  <span>Google Calendar</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            todo.is_done
              ? "bg-emerald-100 text-emerald-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {todo.is_done ? "Đã xong" : "Đang làm"}
        </span>
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-2 ${
          isGrid ? "border-t border-slate-100 pt-2.5" : "pl-7"
        }`}
      >
        <span className="text-xs text-slate-500">
          {createdLabel ? `Tạo: ${createdLabel}` : "Không rõ ngày"}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {onSelectTodo ? (
            <button
              type="button"
              disabled={pending}
              aria-label={`Chi tiết: ${todo.title}`}
              onClick={() => onSelectTodo(todo)}
              className={`${buttonBase} border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`}
            >
              Chi tiết
            </button>
          ) : null}
          <button
            type="button"
            ref={editButtonRef}
            disabled={pending}
            aria-label={`Sửa: ${todo.title}`}
            onClick={() => {
              setDraft(todo.title);
              setError(null);
              setEditing(true);
            }}
            className={`${buttonBase} border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`}
          >
            Sửa
          </button>
          <button
            type="button"
            disabled={pending}
            aria-label={`Xoá: ${todo.title}`}
            onClick={() => {
              if (window.confirm(`Xoá công việc "${todo.title}"?`)) {
                run(deleteTodo, {});
              }
            }}
            className={`${buttonBase} border-red-200 bg-white text-red-700 hover:bg-red-50`}
          >
            Xoá
          </button>
        </div>
      </div>

      {errorEl ? <div className={isGrid ? "" : "pl-7"}>{errorEl}</div> : null}
    </li>
  );
}
