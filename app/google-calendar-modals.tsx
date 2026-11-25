"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  formatTodoDateTime,
  type GoogleCalendarConnectionInfo,
  type TodoRecord,
} from "@/lib/todo-views";
import {
  disconnectGoogleCalendar,
  enableDemoGoogleCalendar,
  syncGoogleCalendarNow,
} from "./actions";
import {
  CalendarIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  LinkIcon,
  RefreshIcon,
  XIcon,
} from "./icons";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export function SettingsModal({
  googleConnection,
  scheduledTodos,
  onClose,
  onOpenConnectWindow,
  statusMessage,
  onClearStatus,
}: {
  googleConnection: GoogleCalendarConnectionInfo;
  scheduledTodos: TodoRecord[];
  onClose: () => void;
  onOpenConnectWindow: () => void;
  statusMessage: string | null;
  onClearStatus: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    setLocalNotice(null);
    onClearStatus();

    if (!googleConnection.enabled) {
      onOpenConnectWindow();
      return;
    }

    startTransition(async () => {
      const result = await disconnectGoogleCalendar();
      if (result.ok) {
        setLocalNotice("Đã tắt liên kết Google Calendar.");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleSyncNow() {
    setError(null);
    setLocalNotice(null);
    onClearStatus();

    startTransition(async () => {
      const result = await syncGoogleCalendarNow();
      if (result.ok) {
        setLocalNotice(
          `Đã đồng bộ ${result.syncedCount} lịch có ngày giờ lên Google Calendar.`,
        );
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const activeMessage = localNotice ?? statusMessage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2
              id="settings-dialog-title"
              className="text-base font-semibold text-slate-900"
            >
              Cài đặt
            </h2>
            <p className="text-xs text-slate-500">
              Quản lý đồng bộ lịch và tích hợp bên ngoài
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className={`inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <CalendarIcon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Liên kết với Google Calendar
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Tự động đưa các task đã đặt ngày giờ lên Google Calendar của
                    bạn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={googleConnection.enabled}
                aria-label="Liên kết với Google Calendar"
                disabled={pending}
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
                  googleConnection.enabled ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block size-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    googleConnection.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3">
              <div className="text-xs text-slate-600">
                {googleConnection.enabled ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                    <CheckCircleIcon className="size-4" />
                    <span>
                      Đã liên kết
                      {googleConnection.googleEmail
                        ? `: ${googleConnection.googleEmail}`
                        : ""}
                      {googleConnection.mode === "demo"
                        ? " (Xem trước cục bộ)"
                        : ""}
                    </span>
                  </span>
                ) : (
                  <span>Trạng thái: Chưa liên kết</span>
                )}
              </div>

              {googleConnection.enabled ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleSyncNow}
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
                >
                  <RefreshIcon className="size-3.5" />
                  <span>{pending ? "Đang đồng bộ..." : "Đồng bộ ngay"}</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800">
                Các lịch đã đặt ngày giờ ({scheduledTodos.length})
              </p>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline ${focusRing}`}
              >
                <span>Mở Google Calendar</span>
                <ExternalLinkIcon className="size-3" />
              </a>
            </div>

            {scheduledTodos.length === 0 ? (
              <p className="text-xs text-slate-500">
                Chưa có task nào được đặt ngày giờ. Hãy thêm ngày giờ khi tạo
                hoặc trong Chi tiết task.
              </p>
            ) : (
              <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
                {scheduledTodos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {todo.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {todo.due_at ? formatTodoDateTime(todo.due_at) : ""}
                      </p>
                    </div>
                    {todo.google_event_link ? (
                      <a
                        href={todo.google_event_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`shrink-0 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-200 ${focusRing}`}
                      >
                        Đã lên lịch
                      </a>
                    ) : todo.google_event_id ? (
                      <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-800">
                        Đã đồng bộ
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-md bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600">
                        Chờ đồng bộ
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error ? (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          ) : null}
          {activeMessage ? (
            <p role="status" className="text-xs font-medium text-emerald-700">
              {activeMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GoogleConnectWindowModal({
  hasOAuthConfig,
  scheduledTodos,
  onClose,
  onConnected,
}: {
  hasOAuthConfig: boolean;
  scheduledTodos: TodoRecord[];
  onClose: () => void;
  onConnected: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [waitingPopup, setWaitingPopup] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as
        | {
            type?: string;
            email?: string | null;
            syncedCount?: number;
            error?: string | null;
          }
        | undefined;
      if (!payload?.type) return;

      if (payload.type === "google-calendar-connected") {
        setWaitingPopup(false);
        router.refresh();
        onConnected(
          `Liên kết thành công${payload.email ? ` (${payload.email})` : ""}! Đã đồng bộ ${payload.syncedCount ?? 0} lịch lên Google Calendar.`,
        );
      } else if (payload.type === "google-calendar-error") {
        setWaitingPopup(false);
        setError(payload.error ?? "Liên kết Google Calendar thất bại.");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnected, router]);

  function handleOpenGoogleOAuthPopup() {
    setError(null);
    const width = 520;
    const height = 660;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(
      0,
      window.screenY + (window.outerHeight - height) / 2,
    );
    const popup = window.open(
      "/api/google-calendar/connect",
      "google-calendar-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      setError(
        "Trình duyệt đang chặn cửa sổ bật lên. Vui lòng cho phép mở cửa sổ bật lên rồi thử lại.",
      );
      return;
    }
    setWaitingPopup(true);
  }

  function handleEnableDemo() {
    setError(null);
    startTransition(async () => {
      const result = await enableDemoGoogleCalendar();
      if (result.ok) {
        router.refresh();
        onConnected(
          `Đã liên kết ở chế độ xem trước và đồng bộ ${result.syncedCount} lịch có ngày giờ.`,
        );
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-connect-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px]"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <LinkIcon className="size-4" />
            </span>
            <div>
              <h2
                id="google-connect-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                Cửa sổ liên kết Google Calendar
              </h2>
              <p className="text-xs text-slate-500">
                Cho phép đồng bộ lịch hẹn từ Todo Note
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ liên kết Google Calendar"
            className={`inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 text-sm text-slate-700">
          <p className="text-xs leading-relaxed text-slate-600">
            Sau khi liên kết thành công, toàn bộ{" "}
            <strong className="text-slate-900">
              {scheduledTodos.length} task đã đặt ngày giờ
            </strong>{" "}
            và các lịch tạo mới về sau sẽ tự động hiển thị trên Google Calendar
            của bạn.
          </p>

          {hasOAuthConfig ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
              Bấm nút bên dưới để mở cửa sổ đăng nhập Google và cấp quyền
              Google Calendar.
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">
                Chưa cấu hình biến môi trường Google OAuth
              </p>
              <p className="mt-1 leading-relaxed">
                Để đồng bộ lên tài khoản Google Calendar thật, hãy thêm{" "}
                <code>GOOGLE_CLIENT_ID</code> và{" "}
                <code>GOOGLE_CLIENT_SECRET</code> vào <code>.env.local</code>{" "}
                (Redirect URI: <code>/api/google-calendar/callback</code>). Bạn
                vẫn có thể bật chế độ xem trước cục bộ để kiểm thử luồng.
              </p>
            </div>
          )}

          {error ? (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
            >
              Huỷ
            </button>

            {hasOAuthConfig ? (
              <button
                type="button"
                disabled={waitingPopup}
                onClick={handleOpenGoogleOAuthPopup}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 ${focusRing}`}
              >
                <CalendarIcon className="size-4" />
                <span>
                  {waitingPopup
                    ? "Đang chờ xác thực Google..."
                    : "Tiếp tục với Google"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={handleEnableDemo}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 ${focusRing}`}
              >
                <CalendarIcon className="size-4" />
                <span>
                  {pending
                    ? "Đang liên kết..."
                    : "Liên kết chế độ xem trước"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
