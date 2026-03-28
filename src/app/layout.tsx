import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dirtyline = localFont({
  src: "../../public/fonts/Dirtyline.woff2",
  variable: "--font-dirtyline",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marketeer",
  description: "AI-powered marketing campaign generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${dirtyline.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col flex-1">{children}</div>
      </body>
    </html>
  );
}
