import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cypherpunk Archive",
  description: "An interactive cipher learning module for Portal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
