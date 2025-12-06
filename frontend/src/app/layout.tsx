import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider"; // <--- Import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cortex | AI Knowledge Base",
  description: "Your Second Brain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider> {/* <--- Wrap Children */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}