"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate, getStatusColor } from "@/lib/utils";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Package,
  ShoppingBag,
} from "lucide-react";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusChange,
}: OrderDetailModalProps) {
  if (!order) return null;

  const statusStyle = getStatusColor(order.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Détails de la Commande #${order.order_number}`}
      description={`Enregistrée le ${formatDate(order.created_at)}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Status & Total Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
              Statut actuel
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {order.status}
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
              Montant à encaisser (Espèces)
            </span>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {formatPrice(order.total)}
            </div>
          </div>
        </div>

        {/* Customer & Delivery Information */}
        <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3 text-xs">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] mb-2">
            Coordonnées du Destinataire
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span className="font-semibold">{order.customer_name}</span>
            </div>

            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <a
                href={`tel:${order.phone}`}
                className="font-mono text-emerald-600 hover:underline"
              >
                {order.phone}
              </a>
            </div>

            {order.email && (
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>{order.email}</span>
              </div>
            )}

            <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
              <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <span>
                {order.address}, <strong className="font-semibold">{order.city}</strong>
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-start gap-2 text-zinc-600 dark:text-zinc-400 bg-amber-500/5 p-2 rounded-xl border-amber-500/10">
              <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                  Instructions de livraison :
                </span>
                <span>{order.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Ordered Items Table */}
        <div className="space-y-3">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
            Articles commandés
          </h4>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Produit</th>
                  <th className="py-2.5 px-3 text-center">Quantité</th>
                  <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-3 text-right">Sous-Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono">
                        x{item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-500">
                        {formatPrice(item.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-400">
                      Aucun détail d&apos;article trouvé pour cette commande.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status update selector in modal */}
        {onStatusChange && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              Modifier l&apos;état :
            </span>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              <option value="En attente">En attente</option>
              <option value="Confirmée">Confirmée</option>
              <option value="Expédiée">Expédiée</option>
              <option value="Livrée">Livrée</option>
              <option value="Annulée">Annulée (remet en stock)</option>
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}
