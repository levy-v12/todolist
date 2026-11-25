"use client";

import { useEffect, useMemo, useState } from "react";
import {
  filterTodos,
  getTodayKey,
  getTodoCounts,
  type GoogleCalendarConnectionInfo,
  type SidebarFilter,
  type TodoRecord,
  type ViewMode,
} from "@/lib/todo-views";
import {
  GoogleConnectWindowModal,
  SettingsModal,
} from "./google-calendar-modals";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  GridIcon,
  ListIcon,
  LogOutIcon,
  MenuIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SidebarCollapseIcon,
  TabIcon,
  XIcon,
} from "./icons";
import { signOut } from "./login/actions";
import { TodoCalendar } from "./todo-calendar";
import { TodoDetailModal } from "./todo-detail-modal";
import { TodoForm } from "./todo-form";
import { TodoItem } from "./todo-item";
import { TodoTabs } from "./todo-tabs";

const SIDEBAR_ITEMS: {
  key: SidebarFilter;
  label: string;
  Icon: typeof NoteIcon;
}[] = [
  { key: "all", label: "Tất cả note", Icon: NoteIcon },
  { key: "today", label: "Hôm nay", Icon: ClockIcon },
  { key: "active", label: "Đang làm", Icon: ListIcon },
  { key: "done", label: "Đã xong", Icon: CheckCircleIcon },
];

const VIEW_MODES: {
  key: ViewMode;
  label: string;
  Icon: typeof GridIcon;
}[] = [
  { key: "calendar", label: "Lịch", Icon: CalendarIcon },
  { key: "grid", label: "Grid", Icon: GridIcon },
  { key: "list", label: "List", Icon: ListIcon },
  { key: "tab", label: "Tab", Icon: TabIcon },
];

const DEFAULT_GOOGLE_CONNECTION: GoogleCalendarConnectionInfo = {
  enabled: false,
  mode: "oauth",
  googleEmail: null,
  hasOAuthConfig: false,
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export function TodoWorkspace({
  initialTodos,
  userEmail,
  loadError = false,
  googleConnection = DEFAULT_GOOGLE_CONNECTION,
}: {
  initialTodos: TodoRecord[];
  userEmail: string;
  loadError?: boolean;
  googleConnection?: GoogleCalendarConnectionInfo;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDefaultDateKey, setAddDefaultDateKey] = useState<
    string | undefined
  >(undefined);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleConnectOpen, setIsGoogleConnectOpen] = useState(false);
  const [googleStatusMessage, setGoogleStatusMessage] = useState<string | null>(
    null,
  );

  const todayKey = useMemo(() => getTodayKey(), []);
  const counts = useMemo(
    () => getTodoCounts(initialTodos, todayKey),
    [initialTodos, todayKey],
  );
  const filteredTodos = useMemo(
    () => filterTodos(initialTodos, activeFilter, searchQuery, todayKey),
    [initialTodos, activeFilter, searchQuery, todayKey],
  );
  const scheduledTodos = useMemo(
    () => initialTodos.filter((todo) => Boolean(todo.due_at)),
    [initialTodos],
  );
  const selectedTodo = useMemo(
    () =>
      selectedTodoId
        ? (initialTodos.find((item) => item.id === selectedTodoId) ?? null)
        : null,
    [initialTodos, selectedTodoId],
  );

  const activeNavItem =
    SIDEBAR_ITEMS.find((item) => item.key === activeFilter) ?? SIDEBAR_ITEMS[0];

  const completionPercent =
    counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0;

  const userInitial = (userEmail.trim().charAt(0) || "U").toUpperCase();

  useEffect(() => {
    if (
      !isAddModalOpen &&
      !mobileSidebarOpen &&
      !selectedTodoId &&
      !isSettingsOpen &&
      !isGoogleConnectOpen
    ) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (isGoogleConnectOpen) {
        setIsGoogleConnectOpen(false);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (selectedTodoId) {
        setSelectedTodoId(null);
      } else if (isAddModalOpen) {
        setIsAddModalOpen(false);
      } else if (mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAddModalOpen,
    mobileSidebarOpen,
    selectedTodoId,
    isSettingsOpen,
    isGoogleConnectOpen,
  ]);

  function selectFilter(filter: SidebarFilter) {
    setActiveFilter(filter);
    setMobileSidebarOpen(false);
  }

  function openAddModal(dateKey?: string) {
    setAddDefaultDateKey(dateKey);
    setIsAddModalOpen(true);
  }

  function openSettings() {
    setMobileSidebarOpen(false);
    setIsSettingsOpen(true);
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {mobileSidebarOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
        />
      ) : null}

      <aside
        aria-label="Thanh điều hướng bên trái"
        data-expanded={sidebarExpanded}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 md:sticky md:top-0 md:z-10 md:h-screen md:shrink-0 ${
          mobileSidebarOpen
            ? "w-64 translate-x-0 shadow-xl"
            : "-translate-x-full md:translate-x-0"
        } ${sidebarExpanded ? "md:w-64" : "md:w-[72px]"}`}
      >
        <div
          className={`flex h-16 items-center border-b border-slate-200 px-3 ${
            sidebarExpanded
              ? "justify-between"
              : "justify-between md:justify-center"
          }`}
        >
          <div
            className={`flex min-w-0 items-center gap-2.5 ${
              sidebarExpanded ? "" : "md:hidden"
            }`}
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-xs">
              TN
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                Todo Note
              </p>
              <p className="truncate text-[11px] text-slate-500">
                Không gian ghi chú
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarExpanded((prev) => !prev)}
            aria-expanded={sidebarExpanded}
            aria-label={
              sidebarExpanded ? "Thu gọn sidebar" : "Mở rộng sidebar"
            }
            title={sidebarExpanded ? "Thu gọn sidebar" : "Mở rộng sidebar"}
            className={`hidden size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline-flex ${focusRing}`}
          >
            <SidebarCollapseIcon
              collapsed={!sidebarExpanded}
              className="size-4"
            />
          </button>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Đóng menu"
            className={`inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden ${focusRing}`}
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {sidebarExpanded ? (
            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Bộ lọc ghi chú
            </p>
          ) : null}

          {SIDEBAR_ITEMS.map(({ key, label, Icon }) => {
            const isActive = activeFilter === key;
            const count = counts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectFilter(key)}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                title={label}
                className={`group flex items-center rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors ${focusRing} ${
                  sidebarExpanded
                    ? "justify-between gap-3"
                    : "justify-between gap-3 md:justify-center"
                } ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon
                    className={`size-5 shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  />
                  <span
                    className={`truncate ${sidebarExpanded ? "" : "md:hidden"}`}
                  >
                    {label}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    sidebarExpanded ? "" : "md:hidden"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {sidebarExpanded ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Tiến độ</span>
                <span className="font-semibold text-blue-700">
                  {completionPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Hoàn thành {counts.done}/{counts.all} ghi chú
              </p>
            </div>
          ) : null}

          <div className="mt-auto pt-3">
            <button
              type="button"
              onClick={openSettings}
              aria-label="Cài đặt"
              title="Cài đặt"
              className={`group flex w-full items-center rounded-xl px-2.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 ${focusRing} ${
                sidebarExpanded
                  ? "justify-between gap-3"
                  : "justify-between gap-3 md:justify-center"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <SettingsIcon className="size-5 shrink-0 text-slate-500 group-hover:text-slate-800" />
                <span
                  className={`truncate ${sidebarExpanded ? "" : "md:hidden"}`}
                >
                  Cài đặt
                </span>
              </span>
              {googleConnection.enabled ? (
                <span
                  className={`size-2 shrink-0 rounded-full bg-emerald-500 ${
                    sidebarExpanded ? "" : "md:hidden"
                  }`}
                  title="Đã liên kết Google Calendar"
                />
              ) : null}
            </button>
          </div>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div
            className={`flex items-center gap-2.5 ${
              sidebarExpanded ? "" : "md:justify-center"
            }`}
          >
            <span
              title={userEmail}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
            >
              {userInitial}
            </span>
            <div
              className={`min-w-0 flex-1 ${sidebarExpanded ? "" : "md:hidden"}`}
            >
              <p className="truncate text-xs font-medium text-slate-900">
                {userEmail || "Tài khoản"}
              </p>
              <p className="text-[11px] text-slate-500">
                {googleConnection.enabled
                  ? "Đã liên kết Google Calendar"
                  : "Đang hoạt động"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Mở menu điều hướng"
                className={`inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden ${focusRing}`}
              >
                <MenuIcon className="size-5" />
              </button>

              <button
                type="button"
                onClick={() => setSidebarExpanded((prev) => !prev)}
                aria-expanded={sidebarExpanded}
                aria-label={
                  sidebarExpanded
                    ? "Thu gọn thanh bên"
                    : "Mở rộng thanh bên"
                }
                className={`hidden size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 md:inline-flex ${focusRing}`}
              >
                <SidebarCollapseIcon
                  collapsed={!sidebarExpanded}
                  className="size-4"
                />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                    {activeNavItem.label}
                  </h1>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {filteredTodos.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
              <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-initial lg:w-64">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm kiếm note..."
                  aria-label="Tìm kiếm note"
                  className={`block w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white ${focusRing}`}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Xoá từ khoá tìm kiếm"
                    className={`absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 ${focusRing}`}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={openSettings}
                aria-label="Mở cài đặt"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
                  googleConnection.enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SettingsIcon className="size-4" />
                <span className="hidden sm:inline">Cài đặt</span>
              </button>

              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 lg:flex">
                <span className="max-w-40 truncate font-medium text-slate-900">
                  {userEmail}
                </span>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 ${focusRing}`}
                >
                  <LogOutIcon className="size-4 text-slate-500" />
                  <span>Đăng xuất</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Quản lý Todo Note
                </h2>
                {googleConnection.enabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    <CalendarIcon className="size-3" />
                    <span>Đã liên kết Google Calendar</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">
                Hiển thị theo lịch, lưới thẻ, danh sách hoặc tab chuyên biệt
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="group"
                aria-label="Chế độ hiển thị ghi chú"
                className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1"
              >
                {VIEW_MODES.map(({ key, label, Icon }) => {
                  const selected = viewMode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setViewMode(key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${focusRing} ${
                        selected
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => openAddModal()}
                className={`inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700 ${focusRing}`}
              >
                <PlusIcon className="size-4" />
                <span>Thêm note</span>
              </button>
            </div>
          </div>

          {loadError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              Không thể tải danh sách công việc. Vui lòng thử lại.
            </div>
          ) : null}

          {!loadError && viewMode === "calendar" ? (
            <TodoCalendar
              todos={filteredTodos}
              onOpenAddModal={openAddModal}
              onSelectTodo={(todo) => setSelectedTodoId(todo.id)}
            />
          ) : null}

          {!loadError && viewMode === "tab" ? (
            <TodoTabs
              todos={initialTodos}
              searchQuery={searchQuery}
              onSelectTodo={(todo) => setSelectedTodoId(todo.id)}
            />
          ) : null}

          {!loadError && (viewMode === "grid" || viewMode === "list") ? (
            filteredTodos.length === 0 ? (
              <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <NoteIcon className="size-6" />
                </span>
                <div className="max-w-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    {initialTodos.length === 0
                      ? "Chưa có ghi chú nào"
                      : "Không tìm thấy ghi chú phù hợp"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {initialTodos.length === 0
                      ? "Bắt đầu bằng cách thêm công việc hoặc ghi chú đầu tiên của bạn."
                      : "Thử thay đổi bộ lọc ở thanh bên hoặc xoá từ khoá tìm kiếm."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {searchQuery || activeFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("all");
                      }}
                      className={`rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
                    >
                      Xoá bộ lọc
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openAddModal()}
                    className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 ${focusRing}`}
                  >
                    <PlusIcon className="size-3.5" />
                    <span>Thêm note</span>
                  </button>
                </div>
              </section>
            ) : viewMode === "grid" ? (
              <ul
                aria-label="Danh sách note dạng lưới"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {filteredTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    variant="grid"
                    onSelectTodo={(item) => setSelectedTodoId(item.id)}
                  />
                ))}
              </ul>
            ) : (
              <ul
                aria-label="Danh sách note dạng danh sách"
                className="flex flex-col gap-2.5"
              >
                {filteredTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    variant="list"
                    onSelectTodo={(item) => setSelectedTodoId(item.id)}
                  />
                ))}
              </ul>
            )
          ) : null}
        </main>
      </div>

      {isAddModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-note-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <div
            aria-hidden="true"
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          />
          <div className="relative z-10 flex h-[min(800px,calc(100vh-1.5rem))] w-[min(800px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2
                  id="add-note-dialog-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Thêm note mới
                </h2>
                <p className="text-xs text-slate-500">
                  Soạn nội dung chi tiết, đính kèm ảnh và hẹn ngày giờ (nếu có)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Đóng hộp thoại thêm note"
                className={`inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <TodoForm
              autoFocus
              defaultDateKey={addDefaultDateKey}
              googleConnected={googleConnection.enabled}
              onSuccess={() => setIsAddModalOpen(false)}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {selectedTodo ? (
        <TodoDetailModal
          key={`${selectedTodo.id}-${selectedTodo.due_at ?? ""}-${selectedTodo.title}-${selectedTodo.is_done}`}
          todo={selectedTodo}
          googleConnection={googleConnection}
          onClose={() => setSelectedTodoId(null)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : null}

      {isSettingsOpen ? (
        <SettingsModal
          googleConnection={googleConnection}
          scheduledTodos={scheduledTodos}
          onClose={() => setIsSettingsOpen(false)}
          onOpenConnectWindow={() => setIsGoogleConnectOpen(true)}
          statusMessage={googleStatusMessage}
          onClearStatus={() => setGoogleStatusMessage(null)}
        />
      ) : null}

      {isGoogleConnectOpen ? (
        <GoogleConnectWindowModal
          hasOAuthConfig={googleConnection.hasOAuthConfig}
          scheduledTodos={scheduledTodos}
          onClose={() => setIsGoogleConnectOpen(false)}
          onConnected={(message) => {
            setIsGoogleConnectOpen(false);
            setGoogleStatusMessage(message);
          }}
        />
      ) : null}
    </div>
  );
}
