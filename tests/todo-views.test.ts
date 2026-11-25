import { describe, expect, it } from "vitest";
import {
  filterTodos,
  formatDateKeyVi,
  formatMonthYearVi,
  getCalendarDays,
  getTodoCounts,
  groupTodosByDate,
  shiftMonth,
  toLocalDateKey,
  type TodoRecord,
} from "@/lib/todo-views";

const SAMPLE_TODOS: TodoRecord[] = [
  {
    id: "1",
    title: "Họp nhóm buổi sáng",
    is_done: false,
    created_at: new Date(2026, 10, 25, 9, 0).toISOString(),
  },
  {
    id: "2",
    title: "Gửi báo cáo tuần",
    is_done: true,
    created_at: new Date(2026, 10, 25, 14, 30).toISOString(),
  },
  {
    id: "3",
    title: "Mua sách mới",
    is_done: false,
    created_at: new Date(2026, 10, 20, 10, 15).toISOString(),
  },
];

describe("todo-views helpers", () => {
  it("toLocalDateKey trả về YYYY-MM-DD hoặc chuỗi rỗng nếu không hợp lệ", () => {
    expect(toLocalDateKey(new Date(2026, 10, 5, 8, 30))).toBe("2026-11-05");
    expect(toLocalDateKey("invalid-date")).toBe("");
  });

  it("getCalendarDays tạo lưới 7 cột bắt đầu từ Thứ 2", () => {
    // Tháng 11/2026: ngày 1 là Chủ nhật -> cần 6 ngày tháng 10 phía trước (26..31).
    const days = getCalendarDays(2026, 10);
    expect(days.length % 7).toBe(0);
    expect(days[0]).toEqual({
      dateKey: "2026-10-26",
      dayNumber: 26,
      isCurrentMonth: false,
    });
    expect(days[6]).toEqual({
      dateKey: "2026-11-01",
      dayNumber: 1,
      isCurrentMonth: true,
    });
  });

  it("shiftMonth chuyển qua lại giữa các năm đúng", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
  });

  it("getTodoCounts tính đúng tổng, hôm nay, đang làm, đã xong", () => {
    expect(getTodoCounts(SAMPLE_TODOS, "2026-11-25")).toEqual({
      all: 3,
      today: 2,
      active: 2,
      done: 1,
    });
  });

  it("filterTodos lọc theo trạng thái và từ khoá tìm kiếm", () => {
    expect(filterTodos(SAMPLE_TODOS, "all", "", "2026-11-25")).toHaveLength(3);
    expect(filterTodos(SAMPLE_TODOS, "today", "", "2026-11-25")).toHaveLength(
      2,
    );
    expect(filterTodos(SAMPLE_TODOS, "active", "", "2026-11-25")).toHaveLength(
      2,
    );
    expect(filterTodos(SAMPLE_TODOS, "done", "", "2026-11-25")).toHaveLength(1);
    expect(
      filterTodos(SAMPLE_TODOS, "all", "BÁO CÁO", "2026-11-25").map((t) => t.id),
    ).toEqual(["2"]);
  });

  it("groupTodosByDate gom nhóm các ghi chú theo ngày", () => {
    const grouped = groupTodosByDate(SAMPLE_TODOS);
    expect(grouped["2026-11-25"]).toHaveLength(2);
    expect(grouped["2026-11-20"]).toHaveLength(1);
  });

  it("formatDateKeyVi và formatMonthYearVi định dạng đúng tiếng Việt", () => {
    expect(formatDateKeyVi("2026-11-25")).toBe("25/11/2026");
    expect(formatMonthYearVi(2026, 10)).toBe("Tháng 11, 2026");
  });
});
