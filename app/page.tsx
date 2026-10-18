import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductGrid } from "@/components/ProductGrid";
import { createClient } from "@/lib/supabase/server";
import { DEMO_PRODUCTS } from "@/lib/demoData";
import { Product } from "@/types";
import { Sparkles, ShieldCheck, Truck, Zap } from "lucide-react";

export const revalidate = 0; // Données dynamiques en temps réel

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  let products: Product[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      products = data as Product[];
    } else {
      // Fallback gracieux si Supabase n'est pas encore initialisé avec les seeds
      products = DEMO_PRODUCTS;
    }
  } catch (err) {
    products = DEMO_PRODUCTS;
  }

  const query = searchParams?.q || "";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-zinc-100/80 via-white to-transparent dark:from-zinc-900/40 dark:via-zinc-950 dark:to-transparent py-14 sm:py-20 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.2),rgba(0,0,0,0))] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <Zap className="w-3.5 h-3.5" />
              Paiement à la livraison • Aucun prépaiement requis
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl mx-auto leading-[1.15]">
              L&apos;excellence technologique à portée de main
            </h1>

            <p className="mt-5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Découvrez notre sélection exclusive d&apos;articles high-tech et accessoires.
              Commandez en quelques clics et réglez en toute sécurité à la réception.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-500" />
                <span>Expédition express sous 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Articles garantis authentiques</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Stock mis à jour en temps réel</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col gap-1 mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Catalogue des Produits
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Explorez nos disponibilités actuelles. Les stocks sont décrémentés en direct.
            </p>
          </div>

          <ProductGrid products={products} initialSearch={query} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
