import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gemini Dark Chat | Next.js 15",
  description: "Advanced AI Chat interface powered by Gemini 3 and Next.js 15",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${inter.className} bg-slate-950 text-slate-200 antialiased overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
