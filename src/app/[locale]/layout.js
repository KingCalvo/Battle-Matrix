import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import BackgroundMusic from "@/components/BackgroundMusic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  return (
    <div
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <BackgroundMusic />
      {children}
    </div>
  );
}
