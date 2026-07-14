import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ilmioinvito.com",
  description: "Crea inviti digitali personalizzati con RSVP e dashboard."
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
