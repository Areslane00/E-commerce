import React from "react";
import { createClient } from "@/lib/supabase/server";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { Order } from "@/types";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  let orders: Order[] = [];

  try {
    const supabase = await createClient();

    // Récupérer les commandes avec leurs items
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      orders = data as Order[];
    }
  } catch (err) {
    console.error("Erreur de récupération des commandes:", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Gestion des Commandes
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Suivez les expéditions, mettez à jour les statuts en direct et consultez les détails clients.
        </p>
      </div>

      <OrdersTable initialOrders={orders} />
    </div>
  );
}
