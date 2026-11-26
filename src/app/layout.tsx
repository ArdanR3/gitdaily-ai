import type { Metadata, Viewport } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-code",
  display: "swap",
});

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitDaily AI · ArdanR3",
  description: "Developer automation dashboard untuk aktivitas harian GitHub akun ArdanR3.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GitDaily AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${firaCode.variable} ${firaSans.variable}`}>
      <body className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-foreground)] antialiased selection:bg-emerald-500/30 selection:text-emerald-100">
        {children}
      </body>
    </html>
  );
}
