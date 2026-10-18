import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CartDrawer } from "@/components/CartDrawer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NOVA Store | E-commerce Moderne & Paiement à la Livraison",
  description: "Boutique en ligne moderne d'équipements technologiques et accessoires avec paiement à la livraison.",
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
