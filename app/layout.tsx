import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ALTERE ESTA PARTE ABAIXO
export const metadata: Metadata = {
  title: "Love365 | Seu presente inesquecível",
  description: "Crie uma página especial e eterna para quem você ama.",
  icons: {
    icon: "/favicon.ico", // Garanta que sua logo esteja na pasta public com este nome
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}