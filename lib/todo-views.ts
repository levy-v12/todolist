import {
  extractPlainTextFromHtml,
  type NoteAttachment,
} from "@/lib/note-content";
import { doesRepeatOccurOnDate, type RepeatRule } from "@/lib/repeat";

export type TodoRecord = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
  due_at?: string | null;
  google_event_id?: string | null;
  google_event_link?: string | null;
  content?: string | null;
  attachments?: NoteAttachment[] | null;
  repeat_rule?: RepeatRule | null;
};

export type GoogleCalendarConnectionInfo = {
  enabled: boolean;
  mode: "oauth" | "demo";
  googleEmail: string | null;
  hasOAuthConfig: boolean;
};

export type SidebarFilter = "all" | "today" | "active" | "done";
export type ViewMode = "calendar" | "grid" | "list" | "tab";
export type NoteTabKey = "all" | "active" | "done" | "today";

export type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

// Chuyển Date hoặc chuỗi ISO thành khoá YYYY-MM-DD theo giờ địa phương.
export function toLocalDateKey(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getTodayKey(now: Date = new Date()): string {
  return toLocalDateKey(now);
}

// Ưu tiên ngày giờ hẹn (due_at) để hiển thị trên lịch, nếu chưa đặt thì dùng created_at.
export function getTodoDisplayDate(todo: TodoRecord): string {
  return todo.due_at || todo.created_at;
}

// Tạo lưới lịch 7 cột bắt đầu từ Thứ 2 (T2 -> CN) cho tháng (monthIndex: 0-11).
export function getCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  // getDay(): CN = 0, T2 = 1 ... T7 = 6 -> đổi sang T2 = 0 ... CN = 6.
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const cells: CalendarDay[] = [];
  for (let index = 0; index < totalCells; index += 1) {
    const cellDate = new Date(year, monthIndex, 1 - leadingDays + index);
    cells.push({
      dateKey: toLocalDateKey(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth:
        cellDate.getFullYear() === year && cellDate.getMonth() === monthIndex,
    });
  }
  return cells;
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const next = new Date(year, monthIndex + delta, 1);
  return { year: next.getFullYear(), monthIndex: next.getMonth() };
}

export function filterTodos(
  todos: TodoRecord[],
  filter: SidebarFilter,
  searchQuery: string,
  todayKey: string = getTodayKey(),
): TodoRecord[] {
  const query = searchQuery.trim().toLowerCase();
  return todos.filter((todo) => {
    if (filter === "active" && todo.is_done) return false;
    if (filter === "done" && !todo.is_done) return false;
    if (
      filter === "today" &&
      toLocalDateKey(getTodoDisplayDate(todo)) !== todayKey
    ) {
      return false;
    }
    if (query.length > 0) {
      const inTitle = todo.title.toLowerCase().includes(query);
      const inContent = extractPlainTextFromHtml(todo.content)
        .toLowerCase()
        .includes(query);
      if (!inTitle && !inContent) {
        return false;
      }
    }
    return true;
  });
}

export function getTodoCounts(
  todos: TodoRecord[],
  todayKey: string = getTodayKey(),
): Record<SidebarFilter, number> {
  let today = 0;
  let active = 0;
  let done = 0;

  for (const todo of todos) {
    if (todo.is_done) done += 1;
    else active += 1;
    if (toLocalDateKey(getTodoDisplayDate(todo)) === todayKey) today += 1;
  }

  return {
    all: todos.length,
    today,
    active,
    done,
  };
}

export function groupTodosByDate(
  todos: TodoRecord[],
): Record<string, TodoRecord[]> {
  const grouped: Record<string, TodoRecord[]> = {};
  for (const todo of todos) {
    const key = toLocalDateKey(getTodoDisplayDate(todo));
    if (!key) continue;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(todo);
  }
  return grouped;
}

export function groupTodosForCalendarDays(
  todos: TodoRecord[],
  days: CalendarDay[],
): Record<string, TodoRecord[]> {
  const grouped: Record<string, TodoRecord[]> = {};
  for (const day of days) {
    grouped[day.dateKey] = [];
  }
  for (const todo of todos) {
    const baseKey = toLocalDateKey(getTodoDisplayDate(todo));
    if (!baseKey) continue;
    if (!todo.repeat_rule?.enabled) {
      if (grouped[baseKey]) grouped[baseKey].push(todo);
      continue;
    }
    for (const day of days) {
      if (doesRepeatOccurOnDate(baseKey, day.dateKey, todo.repeat_rule)) {
        grouped[day.dateKey].push(todo);
      }
    }
  }
  return grouped;
}

export function formatTodoDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatTodoTimeOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function toLocalDateTimeInputValue(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatDateKeyVi(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length !== 3) return dateKey;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatMonthYearVi(year: number, monthIndex: number): string {
  return `Tháng ${monthIndex + 1}, ${year}`;
}
