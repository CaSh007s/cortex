import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // Ensure you ran 'npm install geist' if this errors
import "./globals.css";

export const metadata = {
  title: 'Cortex | AI Knowledge Base', 
  description: 'Intelligent RAG-powered document analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> 
      <body className={`${GeistSans.className} antialiased min-h-screen selection:bg-purple-500/30`}>
        {/* The Animated Background Layer */}
        <div className="aurora-bg" />
        
        {/* The Content Layer */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}