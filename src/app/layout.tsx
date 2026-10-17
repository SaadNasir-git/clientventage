import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";
import { getUser } from "../lib/auth-helpers";
import { User } from "../lib/types";

export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClientVentage",
  description:
    "Manage clients, projects, and project activity in one dashboard.",
};

let user: User | null;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {    
    user = await getUser();
  } catch (error) {
    user = null
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers user={user}>{children}</Providers>
      </body>
    </html>
  );
}