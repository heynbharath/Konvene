import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Konvene — Campus Events OS",
  description: "One platform for every event happening across your campus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <div className="relative min-h-screen overflow-x-hidden bg-surface">
            <div className="pointer-events-none fixed inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
            <div className="pointer-events-none fixed inset-0 bg-radial-fade" />
            <div className="relative z-10">
              <NavBar />
              <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
