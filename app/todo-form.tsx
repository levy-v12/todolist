"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { NoteAttachment } from "@/lib/note-content";
import { TITLE_MAX_LENGTH } from "@/lib/todos";
import { addTodo, type AddTodoState } from "./actions";
import { NoteRichEditor } from "./note-rich-editor";

const initialState: AddTodoState = { successCount: 0 };

function presetDateTimeLocal(daysOffset: number, hour: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);
  target.setHours(hour, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:00`;
}

export function TodoForm({
  onSuccess,
  onCancel,
  autoFocus = false,
  defaultDateKey,
  googleConnected = false,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  defaultDateKey?: string;
  googleConnected?: boolean;
} = {}) {
  const [state, formAction, pending] = useActionState(addTodo, initialState);
  const lastSuccessCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [dueLocal, setDueLocal] = useState(() =>
    defaultDateKey ? `${defaultDateKey}T09:00` : "",
  );
  const [contentHtml, setContentHtml] = useState("");
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);

  const dueIso = useMemo(() => {
    if (!dueLocal) return "";
    const parsed = new Date(dueLocal);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }, [dueLocal]);

  const attachmentsJson = useMemo(
    () => (attachments.length > 0 ? JSON.stringify(attachments) : ""),
    [attachments],
  );

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus, state.successCount]);

  useEffect(() => {
    if (state.successCount > lastSuccessCount.current) {
      lastSuccessCount.current = state.successCount;
      onSuccess?.();
    }
  }, [state.successCount, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-slate-700"
            >
              Tiêu đề note
            </label>
            <span className="text-xs text-slate-500">
              Tối đa {TITLE_MAX_LENGTH} ký tự
            </span>
          </div>

          <input
            // Đổi key sau mỗi lần thêm thành công để xoá ô nhập.
            key={state.successCount}
            ref={inputRef}
            id="title"
            name="title"
            type="text"
            defaultValue={state.title}
            placeholder="Nhập tiêu đề ghi chú hoặc việc cần làm..."
            autoComplete="off"
            aria-describedby={state.error ? "title-error" : undefined}
            aria-invalid={state.error ? true : undefined}
            className="block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Nội dung chi tiết
          </label>
          <NoteRichEditor
            key={`editor-${state.successCount}`}
            onChangeHtml={setContentHtml}
            onChangeAttachments={setAttachments}
            onQuickSubmit={() => formRef.current?.requestSubmit()}
            disabled={pending}
          />
          <input type="hidden" name="content" value={contentHtml} />
          <input type="hidden" name="attachments" value={attachmentsJson} />
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="due_at_local"
              className="text-xs font-semibold text-slate-700"
            >
              Ngày giờ hẹn (tuỳ chọn)
            </label>
            {googleConnected ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                Tự động đồng bộ Google Calendar
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              id="due_at_local"
              type="datetime-local"
              value={dueLocal}
              onChange={(event) => setDueLocal(event.target.value)}
              className="block min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
            <button
              type="button"
              onClick={() => setDueLocal(presetDateTimeLocal(0, 9))}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Hôm nay 09:00
            </button>
            <button
              type="button"
              onClick={() => setDueLocal(presetDateTimeLocal(1, 9))}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Ngày mai 09:00
            </button>
            {dueLocal ? (
              <button
                type="button"
                onClick={() => setDueLocal("")}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Xoá lịch
              </button>
            ) : null}
          </div>
          <input type="hidden" name="due_at" value={dueIso} />
        </div>

        {state.error ? (
          <p id="title-error" role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-[11px] text-slate-500">
          Mẹo: Nhấn Ctrl/Cmd + Enter trong khung nội dung để lưu nhanh
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {onCancel ? (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Huỷ
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang thêm..." : "Lưu note"}
          </button>
        </div>
      </div>
    </form>
  );
}
