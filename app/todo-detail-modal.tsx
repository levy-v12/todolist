"use client";

import { useState, useTransition } from "react";
import type { NoteAttachment } from "@/lib/note-content";
import {
  formatTodoDateTime,
  toLocalDateTimeInputValue,
  type GoogleCalendarConnectionInfo,
  type TodoRecord,
} from "@/lib/todo-views";
import {
  setTodoDone,
  syncGoogleCalendarNow,
  updateTodoDetails,
} from "./actions";
import {
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  RefreshIcon,
  XIcon,
} from "./icons";
import { NoteRichEditor } from "./note-rich-editor";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export function TodoDetailModal({
  todo,
  googleConnection,
  onClose,
  onOpenSettings,
}: {
  todo: TodoRecord;
  googleConnection: GoogleCalendarConnectionInfo;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const [title, setTitle] = useState(todo.title);
  const [dueLocal, setDueLocal] = useState(() =>
    toLocalDateTimeInputValue(todo.due_at),
  );
  const [contentHtml, setContentHtml] = useState(todo.content ?? "");
  const [attachments, setAttachments] = useState<NoteAttachment[]>(
    todo.attachments ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const createdLabel = formatTodoDateTime(todo.created_at) || "Không rõ";
  const dueLabel = todo.due_at
    ? formatTodoDateTime(todo.due_at)
    : "Chưa đặt ngày giờ";

  function submitSave() {
    setError(null);
    setNotice(null);

    let dueIso = "";
    if (dueLocal.trim().length > 0) {
      const parsed = new Date(dueLocal);
      if (Number.isNaN(parsed.getTime())) {
        setError("Ngày giờ hẹn không hợp lệ.");
        return;
      }
      dueIso = parsed.toISOString();
    }

    const formData = new FormData();
    formData.set("id", todo.id);
    formData.set("title", title);
    formData.set("due_at", dueIso);
    formData.set("content", contentHtml);
    formData.set("attachments", JSON.stringify(attachments));

    startTransition(async () => {
      const result = await updateTodoDetails(formData);
      if (result.ok) {
        setNotice(
          dueIso && googleConnection.enabled
            ? "Đã lưu chi tiết và đồng bộ lên Google Calendar."
            : "Đã lưu thay đổi chi tiết task.",
        );
      } else {
        setError(result.error);
      }
    });
  }

  function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    submitSave();
  }

  function handleToggleDone() {
    setError(null);
    setNotice(null);
    const formData = new FormData();
    formData.set("id", todo.id);
    formData.set("is_done", String(!todo.is_done));
    startTransition(async () => {
      const result = await setTodoDone(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function handleSyncNow() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await syncGoogleCalendarNow();
      if (result.ok) {
        setNotice(`Đã đồng bộ ${result.syncedCount} lịch với Google Calendar.`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="todo-detail-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
      />
      <div className="relative z-10 flex h-[min(800px,calc(100vh-1.5rem))] w-[min(800px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="todo-detail-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                Chi tiết task
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  todo.is_done
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {todo.is_done ? "Đã xong" : "Đang làm"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Xem và chỉnh sửa nội dung, ảnh đính kèm, ngày giờ và đồng bộ lịch
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết task"
            className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <form
          onSubmit={handleSaveDetails}
          className="flex min-h-0 flex-1 flex-col gap-3.5"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <ClockIcon className="mt-0.5 size-4 shrink-0 text-blue-600" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">
                    Ngày giờ hẹn
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {dueLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CalendarIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">
                    Ngày giờ tạo
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {createdLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="detail-title"
                  className="text-xs font-semibold text-slate-700"
                >
                  Tiêu đề task
                </label>
                <input
                  id="detail-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={pending}
                  className={`block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${focusRing}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="detail-due-at"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Đặt / đổi ngày giờ hẹn
                  </label>
                  {dueLocal ? (
                    <button
                      type="button"
                      onClick={() => setDueLocal("")}
                      disabled={pending}
                      className={`text-xs font-medium text-red-700 hover:underline ${focusRing}`}
                    >
                      Xoá ngày giờ
                    </button>
                  ) : null}
                </div>
                <input
                  id="detail-due-at"
                  type="datetime-local"
                  value={dueLocal}
                  onChange={(event) => setDueLocal(event.target.value)}
                  disabled={pending}
                  className={`block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${focusRing}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Nội dung chi tiết &amp; ảnh đính kèm
              </span>
              <NoteRichEditor
                initialHtml={todo.content ?? ""}
                initialAttachments={todo.attachments ?? []}
                onChangeHtml={setContentHtml}
                onChangeAttachments={setAttachments}
                onQuickSubmit={submitSave}
                disabled={pending}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    Google Calendar
                  </p>
                  <p className="text-xs text-slate-500">
                    {!googleConnection.enabled
                      ? "Chưa liên kết với Google Calendar."
                      : !todo.due_at
                        ? "Đặt ngày giờ hẹn và lưu để đồng bộ lên Google Calendar."
                        : todo.google_event_id
                          ? googleConnection.mode === "demo"
                            ? "Đã đồng bộ ở chế độ xem trước cục bộ."
                            : "Đã đồng bộ sự kiện lên Google Calendar."
                          : "Chưa đồng bộ sự kiện này."}
                  </p>
                </div>

                {!googleConnection.enabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className={`rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 ${focusRing}`}
                  >
                    Mở cài đặt liên kết
                  </button>
                ) : todo.due_at ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {todo.google_event_link ? (
                      <a
                        href={todo.google_event_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 ${focusRing}`}
                      >
                        <span>Mở Google Calendar</span>
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={handleSyncNow}
                      className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
                    >
                      <RefreshIcon className="size-3.5" />
                      <span>Đồng bộ ngay</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {error ? (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="text-xs font-medium text-emerald-700">
                {notice}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={pending}
              onClick={handleToggleDone}
              className={`rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
            >
              {todo.is_done ? "Đánh dấu chưa xong" : "Đánh dấu đã xong"}
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className={`rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={pending}
                className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                {pending ? "Đang lưu..." : "Lưu chi tiết"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
