"use client";

import { useMemo, useState } from "react";
import {
  formatDateKeyVi,
  formatMonthYearVi,
  formatTodoTimeOnly,
  getCalendarDays,
  getTodayKey,
  groupTodosByDate,
  shiftMonth,
  type TodoRecord,
} from "@/lib/todo-views";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "./icons";
import { TodoItem } from "./todo-item";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function TodoCalendar({
  todos,
  onOpenAddModal,
  onSelectTodo,
}: {
  todos: TodoRecord[];
  onOpenAddModal: (dateKey?: string) => void;
  onSelectTodo?: (todo: TodoRecord) => void;
}) {
  const [todayKey] = useState(() => getTodayKey());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => getTodayKey());

  const grouped = useMemo(() => groupTodosByDate(todos), [todos]);
  const days = useMemo(
    () => getCalendarDays(cursor.year, cursor.monthIndex),
    [cursor.year, cursor.monthIndex],
  );

  const selectedTodos = grouped[selectedDateKey] ?? [];

  function handleToday() {
    const now = new Date();
    setCursor({ year: now.getFullYear(), monthIndex: now.getMonth() });
    setSelectedDateKey(getTodayKey(now));
  }

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Lịch ghi chú theo tháng"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">
            {formatMonthYearVi(cursor.year, cursor.monthIndex)}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setCursor((prev) => shiftMonth(prev.year, prev.monthIndex, -1))
              }
              aria-label="Tháng trước"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() =>
                setCursor((prev) => shiftMonth(prev.year, prev.monthIndex, 1))
              }
              aria-label="Tháng sau"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-slate-600"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((cell) => {
            const dayTodos = grouped[cell.dateKey] ?? [];
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedDateKey;

            return (
              <button
                key={cell.dateKey}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Ngày ${formatDateKeyVi(cell.dateKey)}, ${dayTodos.length} ghi chú`}
                onClick={() => setSelectedDateKey(cell.dateKey)}
                className={`flex min-h-14 flex-col items-stretch justify-between border-r border-b border-slate-100 p-1.5 text-left transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 sm:min-h-24 sm:p-2 ${
                  isSelected
                    ? "bg-blue-50/80 ring-1 ring-blue-500 ring-inset"
                    : cell.isCurrentMonth
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50/70 text-slate-400 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : cell.isCurrentMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {dayTodos.length > 0 ? (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      {dayTodos.length}
                    </span>
                  ) : null}
                </div>

                {dayTodos.length > 0 ? (
                  <div className="mt-1 flex flex-col gap-1">
                    <div className="flex items-center gap-0.5 sm:hidden">
                      {dayTodos.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={`size-1.5 rounded-full ${
                            item.is_done ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="hidden flex-col gap-1 sm:flex">
                      {dayTodos.slice(0, 2).map((item) => {
                        const timeTag = item.due_at
                          ? `${formatTodoTimeOnly(item.due_at)} `
                          : "";
                        return (
                          <span
                            key={item.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              item.is_done
                                ? "bg-emerald-100 text-emerald-800 line-through"
                                : "bg-blue-100/80 text-blue-900"
                            }`}
                          >
                            {timeTag}
                            {item.title}
                          </span>
                        );
                      })}
                      {dayTodos.length > 2 ? (
                        <span className="px-1 text-[10px] font-medium text-slate-500">
                          +{dayTodos.length - 2} khác
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-label="Chi tiết ngày đã chọn"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Note ngày {formatDateKeyVi(selectedDateKey)}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedTodos.length} ghi chú trong ngày này
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAddModal(selectedDateKey)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="size-3.5" />
            Thêm note
          </button>
        </div>

        {selectedTodos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
            Không có ghi chú nào trong ngày {formatDateKeyVi(selectedDateKey)}.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {selectedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                variant="list"
                onSelectTodo={onSelectTodo}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
