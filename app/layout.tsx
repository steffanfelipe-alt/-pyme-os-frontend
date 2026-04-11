import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PyME OS — Gestión contable",
  description: "Plataforma de gestión para estudios contables argentinos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
