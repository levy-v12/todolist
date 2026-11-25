"use client";

import { useMemo, useState } from "react";
import {
  filterTodos,
  getTodayKey,
  getTodoCounts,
  type NoteTabKey,
  type TodoRecord,
} from "@/lib/todo-views";
import { TodoItem } from "./todo-item";

const TABS: { key: NoteTabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang làm" },
  { key: "done", label: "Đã xong" },
  { key: "today", label: "Hôm nay" },
];

export function TodoTabs({
  todos,
  searchQuery,
  onSelectTodo,
}: {
  todos: TodoRecord[];
  searchQuery: string;
  onSelectTodo?: (todo: TodoRecord) => void;
}) {
  const [activeTab, setActiveTab] = useState<NoteTabKey>("all");
  const todayKey = useMemo(() => getTodayKey(), []);

  const searchMatched = useMemo(
    () => filterTodos(todos, "all", searchQuery, todayKey),
    [todos, searchQuery, todayKey],
  );
  const counts = useMemo(
    () => getTodoCounts(searchMatched, todayKey),
    [searchMatched, todayKey],
  );
  const visibleTodos = useMemo(
    () => filterTodos(searchMatched, activeTab, "", todayKey),
    [searchMatched, activeTab, todayKey],
  );

  const panelId = `note-tabpanel-${activeTab}`;
  const tabId = (key: NoteTabKey) => `note-tab-${key}`;

  return (
    <section
      aria-label="Hiển thị ghi chú dạng tab"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <div
        role="tablist"
        aria-label="Phân loại ghi chú theo tab"
        className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50/80 px-3 pt-2.5"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={tabId(tab.key)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isSelected
                  ? "-mb-px border-slate-200 bg-white text-blue-700"
                  : "border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isSelected
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(activeTab)}
        className="p-4"
      >
        {visibleTodos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
            Không có ghi chú nào trong tab này.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                variant="grid"
                onSelectTodo={onSelectTodo}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
