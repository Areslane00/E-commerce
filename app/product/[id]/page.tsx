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

  // Si pas de prix barré en BDD pour les tests initiaux
  if (!product.original_price) {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes("téléphone") || nameLower.includes("telephone")) {
      product.original_price = Math.round(product.price * 1.2);
    } else if (nameLower.includes("casque") || nameLower.includes("montre") || nameLower.includes("lampe")) {
      product.original_price = Math.round(product.price * 1.25);
    }
  }

  const hasPromo = Boolean(
    product.original_price && Number(product.original_price) > Number(product.price)
  );
  const discountPercent = hasPromo
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>Retour au catalogue / العودة للمتجر</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Large Image Showcase */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg">
            {hasPromo && (
              <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide uppercase bg-rose-600 text-white shadow-xl animate-pulse">
                  <span>(Promotion) / (تخفيض)</span>
                  {discountPercent > 0 && <span>-{discountPercent}%</span>}
                </span>
              </div>
            )}
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

              {/* Price display with Prix Avant & Prix Actuel */}
              <div className="mt-4 flex flex-col gap-2">
                {hasPromo ? (
                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black uppercase bg-rose-600 text-white shadow-sm">
                        (Promotion) / (تخفيض)
                      </span>
                      <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                        Prix avant / السعر السابق :
                      </span>
                      <span className="text-base sm:text-lg line-through text-zinc-400 dark:text-zinc-500 font-bold">
                        {formatPrice(product.original_price!)}
                      </span>
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                        Économisez -{discountPercent}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2.5 pt-1">
                      <span className="text-xs sm:text-sm uppercase text-emerald-600 dark:text-emerald-400 font-black">
                        Prix actuel / السعر الحالي :
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-zinc-400 font-medium">
                  Livraison 58 Wilayas • Paiement en espèces à la livraison
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-b border-zinc-200/80 dark:border-zinc-800/80 py-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-2">
                Description / تفاصيل المنتج
              </h4>
              <p>{product.description || "Produit de haute qualité disponible à la commande dès maintenant."}</p>
            </div>

            {/* Interactive Client Component for Stock & Quantity */}
            <ProductDetailClient product={product} />

            {/* Guarantees Box for Algeria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <Truck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Livraison 58 Wilayas
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
                  Vérification du colis
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
