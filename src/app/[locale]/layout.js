import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import BackgroundMusic from "@/components/BackgroundMusic";
import { getDictionary } from "@/lib/getDictionary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }) {
  const { locale } = await params;

  const dict = await getDictionary(locale);

  const title = "BATTLE MATRIX";

  const description =
    locale === "es"
      ? "Juego de estrategia inspirado en Tic Tac Toe donde luchas en batallas online y locales usando personajes únicos y múltiples vidas."
      : "Strategy game inspired by Tic Tac Toe where you fight in online and local battles using unique characters and multiple lives.";

  return {
    metadataBase: new URL("https://battle-matrix.vercel.app"),

    title,

    description,

    openGraph: {
      title,

      description,

      url: `https://battle-matrix.vercel.app/${locale}`,

      siteName: "BATTLE MATRIX",

      locale: locale === "es" ? "es_MX" : "en_US",

      type: "website",

      images: [
        {
          url: "https://battle-matrix.vercel.app/logo.png",
          width: 1254,
          height: 1254,
          alt: "BATTLE MATRIX",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title,

      description,

      images: ["https://battle-matrix.vercel.app/logo.png"],
    },
    icons: {
      icon: "/fondo.png",
      shortcut: "/fondo.png",
      apple: "/fondo.png",
    },
  };
}

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
