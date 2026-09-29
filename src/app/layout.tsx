import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Setu — Elder Care, Bridged Across Distance",
  description: "Peace of mind for families caring for elderly parents in India, from anywhere in the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-sand text-foreground">{children}</body>
    </html>
  );
}
