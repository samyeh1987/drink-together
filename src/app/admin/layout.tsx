import type { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";
import { AdminI18nProvider } from "./AdminI18nProvider";

export const metadata: Metadata = {
  title: "DrinkTogether Admin",
  description: "Admin dashboard for DrinkTogether platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-dark">
        <div className="flex lg:pl-64">
          <AdminI18nProvider>
            <AdminLayoutClient>{children}</AdminLayoutClient>
          </AdminI18nProvider>
        </div>
      </body>
    </html>
  );
}
