import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ReelAtlas - Brand Intelligence Platform",
  description:
    "Discover and analyze brand presence across the web with ReelAtlas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${dmSans.variable} ${instrumentSerif.variable} font-[family-name:var(--font-dm-sans)] antialiased`}>
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
