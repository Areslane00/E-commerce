"use client";

import React, { useState } from "react";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate, getStatusColor } from "@/lib/utils";
import { OrderDetailModal } from "./OrderDetailModal";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  ShoppingBag,
  Phone,
  Calendar,
  Check,
} from "lucide-react";

interface OrdersTableProps {
  initialOrders: Order[];
}

export function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { success, error, info } = useToast();

  // Handle status update
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId);

    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      if (newStatus === "Annulée") {
        info("La commande est annulée. Les articles ont été réintégrés au stock.", "Stock restauré");
      } else {
        success(`Statut mis à jour : "${newStatus}"`, "Commande modifiée");
      }
    } catch (err: any) {
      error(err.message || "Erreur de mise à jour du statut", "Erreur");
    } finally {
      setIsUpdating(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();

    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.phone.toLowerCase().includes(query) ||
      order.city.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par n° commande, nom du client, tél..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-foreground transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {["all", "En attente", "Confirmée", "Expédiée", "Livrée", "Annulée"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100/70 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-750"
              }`}
            >
              {st === "all" ? "Toutes" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Aucune commande trouvée
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
              Aucune commande ne correspond aux filtres appliqués.
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-850/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">N° Commande</th>
                  <th className="py-3.5 px-4">Client & Contact</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {filteredOrders.map((order) => {
                  const statusStyle = getStatusColor(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                        {order.order_number}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.customer_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{order.phone}</span>
                          <span className="mx-1">•</span>
                          <span>{order.city}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-zinc-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="py-4 px-4 font-black text-zinc-900 dark:text-zinc-50 text-sm whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>

                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          disabled={isUpdating === order.id}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-900 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <option value="En attente">En attente</option>
                          <option value="Confirmée">Confirmée</option>
                          <option value="Expédiée">Expédiée</option>
                          <option value="Livrée">Livrée</option>
                          <option value="Annulée">Annulée (remet en stock)</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
