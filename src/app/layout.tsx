import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Link from "next/link";
import "./globals.css";
import UnconventionalNavbar from "@/components/UnconventionalNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Not A Budget Spreadsheet",
  description: "A better way to track your finances",
};

function UnconventionalFooter() {
  return (
    <footer className="fixed bottom-0 left-16 right-0 h-12 flex items-center justify-between px-8 bg-gradient-to-r from-indigo-100 to-indigo-200 shadow-inner z-40">
      <div className="flex gap-4 items-center">
        <span className="text-indigo-700 font-mono text-xs">
          not-a-budget-spreadsheet
        </span>
        <span className="text-gray-400 text-xs">
          © {new Date().getFullYear()}
        </span>
      </div>
      <div className="flex gap-4 items-center">
        <Link
          href="/dashboard"
          className="text-indigo-700 hover:underline text-xs"
        >
          Dashboard
        </Link>
        <Link href="/auth" className="text-indigo-700 hover:underline text-xs">
          Auth
        </Link>
        <Link href="/" className="text-indigo-700 hover:underline text-xs">
          Home
        </Link>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <UnconventionalNavbar />
          <main className="ml-16 pb-12 min-h-screen flex flex-col">
            {children}
          </main>
          <UnconventionalFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
