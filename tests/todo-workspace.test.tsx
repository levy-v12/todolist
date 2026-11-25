// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TodoRecord } from "@/lib/todo-views";

const mockRefresh = vi.fn();
const mockEnableDemo = vi.fn(async () => ({
  ok: true as const,
  syncedCount: 1,
  mode: "demo" as const,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/actions", () => ({
  addTodo: vi.fn(async (prev: { successCount: number }) => ({
    successCount: prev.successCount + 1,
  })),
  setTodoDone: vi.fn(async () => ({ ok: true })),
  updateTodoTitle: vi.fn(async () => ({ ok: true })),
  deleteTodo: vi.fn(async () => ({ ok: true })),
  updateTodoDetails: vi.fn(async () => ({ ok: true })),
  enableDemoGoogleCalendar: () => mockEnableDemo(),
  disconnectGoogleCalendar: vi.fn(async () => ({ ok: true })),
  syncGoogleCalendarNow: vi.fn(async () => ({ ok: true, syncedCount: 1 })),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: vi.fn(async () => {}),
}));

import { TodoWorkspace } from "@/app/todo-workspace";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const TODAY_ISO = new Date().toISOString();

const TODOS: TodoRecord[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Thiết kế giao diện mới",
    is_done: false,
    created_at: TODAY_ISO,
    due_at: "2026-11-25T09:30:00.000Z",
    google_event_id: null,
    google_event_link: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Viết test cho trang chủ",
    is_done: true,
    created_at: TODAY_ISO,
    due_at: null,
    google_event_id: null,
    google_event_link: null,
  },
];

describe("TodoWorkspace", () => {
  it("hiển thị sidebar có thể thu gọn/mở rộng, top header và nút thêm note", () => {
    render(
      <TodoWorkspace initialTodos={TODOS} userEmail="nguoidung@example.com" />,
    );

    const sidebar = screen.getByLabelText("Thanh điều hướng bên trái");
    expect(sidebar).toHaveAttribute("data-expanded", "true");

    const collapseBtn = screen.getByRole("button", {
      name: "Thu gọn sidebar",
    });
    fireEvent.click(collapseBtn);
    expect(sidebar).toHaveAttribute("data-expanded", "false");

    const expandBtn = screen.getByRole("button", {
      name: "Mở rộng sidebar",
    });
    fireEvent.click(expandBtn);
    expect(sidebar).toHaveAttribute("data-expanded", "true");

    const header = screen.getByRole("banner");
    expect(
      within(header).getByText("nguoidung@example.com"),
    ).toBeInTheDocument();
    expect(
      within(header).getByRole("button", { name: /Đăng xuất/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Thêm note" }),
    ).toBeInTheDocument();
  });

  it("chuyển đổi qua lại giữa 4 chế độ hiển thị: Grid, List, Lịch, Tab", () => {
    render(
      <TodoWorkspace initialTodos={TODOS} userEmail="nguoidung@example.com" />,
    );

    expect(
      screen.getByRole("list", { name: "Danh sách note dạng lưới" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "List" }));
    expect(
      screen.getByRole("list", { name: "Danh sách note dạng danh sách" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lịch" }));
    expect(
      screen.getByRole("region", { name: "Lịch ghi chú theo tháng" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tab" }));
    const tablist = screen.getByRole("tablist", {
      name: "Phân loại ghi chú theo tab",
    });
    expect(tablist).toBeInTheDocument();

    const doneTab = within(tablist).getByRole("tab", { name: /Đã xong/i });
    fireEvent.click(doneTab);
    expect(doneTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Viết test cho trang chủ")).toBeInTheDocument();
    expect(
      screen.queryByText("Thiết kế giao diện mới"),
    ).not.toBeInTheDocument();
  });

  it("bấm nút Thêm note mở popup kích thước 800x800 với bộ công cụ typography, phím tắt, thêm ảnh và ô hẹn ngày giờ", () => {
    render(
      <TodoWorkspace initialTodos={TODOS} userEmail="nguoidung@example.com" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Thêm note" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.innerHTML).toContain("800px");
    expect(within(dialog).getByLabelText("Tiêu đề note")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("toolbar", {
        name: "Thanh công cụ định dạng nội dung note",
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText("Kiểu khối & Heading"),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Kiểu chữ")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Cỡ chữ")).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText("Biến đổi chữ (Transform)"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "+ Thêm ảnh" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText("Ngày giờ hẹn (tuỳ chọn)"),
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Phím tắt" }));
    expect(within(dialog).getByText("Ctrl/Cmd + B")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mở chi tiết task hiển thị ngày giờ hẹn và ngày giờ tạo", () => {
    render(
      <TodoWorkspace initialTodos={TODOS} userEmail="nguoidung@example.com" />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Chi tiết: Thiết kế giao diện mới" }),
    );
    const detailDialog = screen.getByRole("dialog", { name: "Chi tiết task" });
    expect(within(detailDialog).getByText("Ngày giờ hẹn")).toBeInTheDocument();
    expect(within(detailDialog).getByText("Ngày giờ tạo")).toBeInTheDocument();
    expect(
      within(detailDialog).getByLabelText("Đặt / đổi ngày giờ hẹn"),
    ).toBeInTheDocument();
  });

  it("vào Cài đặt => bật toggle liên kết Google Calendar => mở cửa sổ liên kết và liên kết thành công", async () => {
    render(
      <TodoWorkspace initialTodos={TODOS} userEmail="nguoidung@example.com" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở cài đặt" }));
    const settingsDialog = screen.getByRole("dialog", { name: "Cài đặt" });
    expect(settingsDialog).toBeInTheDocument();

    const toggle = within(settingsDialog).getByRole("switch", {
      name: "Liên kết với Google Calendar",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);

    const connectWindow = screen.getByRole("dialog", {
      name: "Cửa sổ liên kết Google Calendar",
    });
    expect(connectWindow).toBeInTheDocument();
    expect(
      within(connectWindow).getByText(/1 task đã đặt ngày giờ/i),
    ).toBeInTheDocument();

    fireEvent.click(
      within(connectWindow).getByRole("button", {
        name: "Liên kết chế độ xem trước",
      }),
    );

    await waitFor(() => {
      expect(mockEnableDemo).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByRole("dialog", {
        name: "Cửa sổ liên kết Google Calendar",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(settingsDialog).getByText(/Đã liên kết ở chế độ xem trước/i),
    ).toBeInTheDocument();
  });

  it("lọc note theo thanh tìm kiếm trên top header và bộ lọc sidebar", () => {
    render(
      <TodoWorkspace initialTodos={TODOS} userEmail="nguoidung@example.com" />,
    );

    const searchInput = screen.getByLabelText("Tìm kiếm note");
    fireEvent.change(searchInput, { target: { value: "giao diện" } });
    expect(screen.getByText("Thiết kế giao diện mới")).toBeInTheDocument();
    expect(
      screen.queryByText("Viết test cho trang chủ"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Xoá từ khoá tìm kiếm" }),
    );
    expect(screen.getByText("Viết test cho trang chủ")).toBeInTheDocument();

    const sidebar = screen.getByLabelText("Thanh điều hướng bên trái");
    fireEvent.click(within(sidebar).getByRole("button", { name: "Đang làm" }));
    expect(screen.getByText("Thiết kế giao diện mới")).toBeInTheDocument();
    expect(
      screen.queryByText("Viết test cho trang chủ"),
    ).not.toBeInTheDocument();
  });
});
