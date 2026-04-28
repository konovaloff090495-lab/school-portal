import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YandexMetrika from "@/components/YandexMetrika";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Школы России — каталог государственных, частных и онлайн школ",
  description:
    "Крупнейший каталог школ России. Государственные, частные, онлайн-школы, вечерние и экстернат. Адреса, телефоны, описания, отзывы.",
  keywords:
    "школы России, каталог школ, частные школы, онлайн школы, вечерние школы, экстернат",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://pro-schools.ru/" },
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
      <body className={`${inter.className} bg-[#F8FAFC] min-h-screen`}>
        <YandexMetrika />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
