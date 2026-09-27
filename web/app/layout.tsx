import type { Metadata, Viewport } from "next";
import { BottomNav } from "../components/BottomNav";
import { DemoBanner } from "../components/DemoBanner";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Petai — A living digital creature that belongs to you",
    template: "%s · Petai",
  },
  description:
    "Create any creature you can imagine. Raise it, play with it, and discover the life it lives when you're away. Not an assistant — a companion.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Petai",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F97316",
};

const SW_ENABLED = process.env.NODE_ENV === "production";

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <DemoBanner />
        <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6">
          {children}
        </main>
        <BottomNav />
        {SW_ENABLED && <ServiceWorkerRegister />}
      </body>
    </html>
  );
}
