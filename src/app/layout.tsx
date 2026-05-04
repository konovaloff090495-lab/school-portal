import type { Metadata } from "next";
import { Inter, Unbounded, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YandexMetrika from "@/components/YandexMetrika";
import ScrollToTop from "@/components/ScrollToTop";
import GeoPrompt from "@/components/GeoPrompt";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-unbounded",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Школы России — каталог государственных, частных и онлайн школ",
  description:
    "Крупнейший каталог школ России. Государственные, частные, онлайн-школы, вечерние и экстернат. Адреса, телефоны, описания, отзывы.",
  keywords:
    "школы России, каталог школ, частные школы, онлайн школы, вечерние школы, экстернат",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://pro-schools.ru/" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://pro-schools.ru",
    siteName: "ШколыРоссии.рф",
    title: "Школы России — каталог школ",
    description:
      "Государственные, частные, онлайн-школы, вечерние и экстернат. Адреса, телефоны, описания.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ШколыРоссии.рф — каталог школ" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} ${unbounded.variable} ${manrope.variable} bg-[#F8FAFC] min-h-screen`}>
        <YandexMetrika />
        <Header />
        <GeoPrompt />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
