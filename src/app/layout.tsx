import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DrinkTogether - Don't Drink Alone",
  description: "Find new friends over great drinks in Thailand. Join or host drink sessions, meet amazing people.",
  keywords: ["drink together", "social drinking", "Thailand", "Bangkok", "make friends", "bar", "meetup"],
  openGraph: {
    title: "DrinkTogether - Don't Drink Alone",
    description: "Find new friends over great drinks in Thailand. Join or host drink sessions.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN", "th_TH"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DrinkTogether",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DrinkTogether - Don't Drink Alone",
    description: "Find new friends over great drinks in Thailand.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
