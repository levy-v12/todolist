import { describe, expect, it, vi } from "vitest";

const { order, cookies, connection, createServerClient } = vi.hoisted(() => {
  const order: string[] = [];
  return {
    order,
    cookies: vi.fn(async () => {
      order.push("cookies");
      return { getAll: () => [], set: vi.fn() };
    }),
    connection: vi.fn(async () => {
      order.push("connection");
    }),
    createServerClient: vi.fn(() => {
      order.push("createServerClient");
      return {};
    }),
  };
});

vi.mock("next/headers", () => ({ cookies }));
vi.mock("next/server", () => ({ connection }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

import { createClient } from "@/lib/supabase/server";

describe("createClient (server)", () => {
  it("gọi connection() trước khi tạo client để việc đọc phiên chỉ chạy ở request thật", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    await createClient();
    expect(order.indexOf("connection")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("connection")).toBeLessThan(
      order.indexOf("createServerClient"),
    );
    vi.unstubAllEnvs();
  });
});
