import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Nav from "./components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Appointments App",
  description: "Auth0 + Spring Boot demo",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100`}
      >
        <Providers>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Nav />
            {/* Page content */}
            <div className="py-6 sm:py-8 lg:py-10">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
