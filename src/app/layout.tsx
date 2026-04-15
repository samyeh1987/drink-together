import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EatTogether - Don't Eat Alone",
  description: "Find new friends over great food in Bangkok. Join or host meals, meet amazing people.",
  keywords: ["eat together", "social dining", "Bangkok", "make friends", "food", "meetup"],
  openGraph: {
    title: "EatTogether - Don't Eat Alone",
    description: "Find new friends over great food in Bangkok",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN", "th_TH"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
