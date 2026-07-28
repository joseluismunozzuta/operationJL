import type { Metadata } from "next";
import { Geist, Geist_Mono, Special_Elite } from "next/font/google";
import "./globals.css";
import { CASE_NUMBER } from "@/lib/event-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `CASO N.° ${CASE_NUMBER} — Expediente JL`,
  description: "Expediente confidencial. Acceso restringido a testigos citados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="paper-texture min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
