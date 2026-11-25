import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo Note — Việc cần làm",
  description: "Ứng dụng ghi chú và quản lý công việc cần làm.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col overflow-x-hidden bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
