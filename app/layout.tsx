import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Amiri, Cairo, Reem_Kufi } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-amiri",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-reem-kufi",
});

export const metadata: Metadata = {
  title: "ليكِ يا سكرة 🤍",
  description: "حاجة صغيرة لقلبك.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${amiri.variable} ${cairo.variable} ${reemKufi.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
