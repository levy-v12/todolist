import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Việc cần làm",
  description: "Ứng dụng ghi lại công việc cần làm.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
