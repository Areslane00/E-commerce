import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomeHero } from "@/components/HomeHero";
import { ProductGrid } from "@/components/ProductGrid";
import { createClient } from "@/lib/supabase/server";
import { DEMO_PRODUCTS } from "@/lib/demoData";
import { Product } from "@/types";
import { parseProducts } from "@/lib/utils";

export const revalidate = 0; // Données dynamiques en direct

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
      products = parseProducts(data).sort((a, b) => {
        const aInStock = a.stock > 0 ? 1 : 0;
        const bInStock = b.stock > 0 ? 1 : 0;
        if (aInStock !== bInStock) return bInStock - aInStock;
        return 0;
      });
    } else {
      products = parseProducts(DEMO_PRODUCTS);
    }
  } catch (err) {
    products = parseProducts(DEMO_PRODUCTS);
  }

  const query = searchParams?.q || "";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section généraliste & adapté à l'Algérie */}
        <HomeHero />

        {/* Product Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProductGrid products={products} initialSearch={query} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
