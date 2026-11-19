import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";
import { KonveneCopilot } from "@/components/ai/KonveneCopilot";

export const metadata: Metadata = {
  title: "Konvene — Campus Events OS",
  description: "One platform for every event happening across your campus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <CustomCursor />
          <div className="relative min-h-screen bg-paper text-ink">
            <div className="pointer-events-none fixed inset-0 bg-dot-grid bg-dots opacity-60" />
            <div className="pointer-events-none fixed inset-0 bg-noise opacity-[0.035] mix-blend-multiply" />
            <div className="relative z-10">
              <NavBar />
              <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
              <Footer />
              <KonveneCopilot />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
