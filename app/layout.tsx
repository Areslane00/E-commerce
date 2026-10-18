import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CartDrawer } from "@/components/CartDrawer";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d10" },
  ],
};

export const metadata: Metadata = {
  title: "AresStore | Boutique en ligne en Algérie • Paiement à la livraison",
  description: "Commandez en ligne partout en Algérie (58 Wilayas) et payez en espèces à la réception de votre colis. Tout ce dont vous avez besoin au meilleur prix.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <CartDrawer />
        </ToastProvider>
      </body>
    </html>
  );
}
