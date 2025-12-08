import type { Metadata } from "next";
// 1. Import the new fonts
import { Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

// 2. Configure them
const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space", // This variable will be used in Tailwind
  weight: ["300", "400", "500", "600", "700"],
});

const orbitron = Orbitron({ 
  subsets: ["latin"], 
  variable: "--font-orbitron", 
  weight: ["400", "500", "700", "900"],
});

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
      {/* 3. Inject variables into the body */}
      <body className={`${spaceGrotesk.variable} ${orbitron.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}