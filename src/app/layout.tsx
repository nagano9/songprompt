import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anti-Slop Audio Studio · Suno & Udio Prompt Engineering Console",
  description: "Studio kalibrasi prompt musik Suno v4, v3.5 & Udio v1.5 untuk menghasilkan komposisi berkarakter dan bebas klise generik AI.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0e" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-accent/30 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
