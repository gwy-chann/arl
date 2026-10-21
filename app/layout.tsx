import type { Metadata } from "next";
import { Figtree, Courier_Prime } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARLQ Inventory and Sales System",
  description:
    "ARLQ Food Condiments Trading: inventory monitoring and sales system for toyo, suka and patis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-secondary font-sans">{children}</body>
    </html>
  );
}
