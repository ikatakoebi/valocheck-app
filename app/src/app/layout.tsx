import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VALOCHECK - Valorant戦績トラッカー",
  description: "Riot IDを入力するだけでValorantの戦績・ランク・マッチ履歴を日本語で確認",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-indigo-600 font-black text-xl tracking-tight group-hover:text-indigo-500 transition-colors">
                VALO
              </span>
              <span className="text-slate-800 font-black text-xl tracking-tight">
                CHECK
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-muted-foreground text-xs">
            VALOCHECK は Riot Games と提携・承認されたものではありません
          </div>
        </footer>
      </body>
    </html>
  );
}
