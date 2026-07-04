import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "แบบทดสอบ ACT เสมือนจริง",
  description:
    "ข้อสอบภาษาอังกฤษตามรูปแบบ ACT (American College Testing) พร้อมระบบวัดผลและระบบหลังบ้าน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${inter.variable} ${notoSansThai.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
