import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { DEMO_PRODUCTS } from "@/lib/demoData";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ProductDetailClient } from "./ProductDetailClient";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let product: Product | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single();

    if (data) {
      product = data as Product;
    } else {
      product = DEMO_PRODUCTS.find((p) => p.id === params.id) || null;
    }
  } catch (err) {
    product = DEMO_PRODUCTS.find((p) => p.id === params.id) || null;
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Large Image Showcase */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                Aucune image disponible
              </div>
            )}
          </div>

          {/* Product Info & Interactive Client Area */}
          <div className="flex flex-col space-y-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 mb-3">
                {product.category}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-zinc-400">TTC / Paiement à la livraison</span>
              </div>
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-b border-zinc-200/80 dark:border-zinc-800/80 py-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-2">
                Description du produit
              </h4>
              <p>{product.description || "Aucune description détaillée."}</p>
            </div>

            {/* Interactive Client Component for Stock & Quantity */}
            <ProductDetailClient product={product} />

            {/* Guarantees Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <Truck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Livraison 24h à 48h
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Paiement à la réception
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <RotateCcw className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Retour sous 14 jours
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
