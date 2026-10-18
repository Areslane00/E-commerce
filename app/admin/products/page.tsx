import React from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { DEMO_PRODUCTS } from "@/lib/demoData";
import { Product } from "@/types";
import { parseProducts } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminProductsPage() {
  let products: Product[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      products = parseProducts(data);
    } else {
      products = parseProducts(DEMO_PRODUCTS);
    }
  } catch (err) {
    products = parseProducts(DEMO_PRODUCTS);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Gestion des Produits & Stock
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Ajustez les stocks en un clic, créez de nouveaux articles et téléversez des photos produit.
        </p>
      </div>

      <ProductsManager initialProducts={products} />
    </div>
  );
}
