import type { Metadata } from "next";
import { Figtree, Courier_Prime } from "next/font/google";
import { ThemeScript } from "@/components/theme/theme-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ConfirmProvider } from "@/components/ui/confirm-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${courierPrime.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-full flex flex-col bg-bg-base text-text-secondary font-sans"
        suppressHydrationWarning
      >
        <ToastProvider>
          <ConfirmProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
            <div id="modal-root" />
            <div id="toasts" />
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
