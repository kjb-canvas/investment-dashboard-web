import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "투자 모아보기",
  description: "업비트·증권사 자산을 한 화면에서 모아보는 투자 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
