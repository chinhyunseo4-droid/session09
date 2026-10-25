import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Session 09 · Agent Lab",
  description: "도구를 선택하고 실행하는 에이전트 실습 데모",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
