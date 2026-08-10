import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./builder.css";

export const metadata: Metadata = {
  title: "ilmioinvito.com",
  description: "Crea inviti digitali personalizzati con RSVP e dashboard."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
