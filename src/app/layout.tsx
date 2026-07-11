import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DimensiTech | Celulares y accesorios",
  description: "Sistema de compras, ventas, inventario, reservas y tienda virtual",
  icons: {
    icon: "/uploads/logo/icono.ico",
    shortcut: "/uploads/logo/icono.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
