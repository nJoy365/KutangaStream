import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Migrate } from "@/components/Migrate";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { template: "%s · KutangaStream", default: "KutangaStream" },
  description: "Watch movies and TV shows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <ToastProvider>
          <Migrate />
          <Navbar />
          <main className="pt-16 pb-20 md:pb-0">{children}</main>
          <MobileBottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
