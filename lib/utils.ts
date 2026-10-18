import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus, Product } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatage des montants en Dinars Algériens (DZD / د.ج)
 */
export function formatPrice(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount) || 0;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
  return `${formatted} DZD`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusColor(status: OrderStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case "En attente":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-500/20",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    case "Confirmée":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
      };
    case "Expédiée":
      return {
        bg: "bg-purple-500/10 dark:bg-purple-500/20",
        text: "text-purple-700 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
        dot: "bg-purple-500",
      };
    case "Livrée":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    case "Annulée":
      return {
        bg: "bg-rose-500/10 dark:bg-rose-500/20",
        text: "text-rose-700 dark:text-rose-400",
        border: "border-rose-200 dark:border-rose-800",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
        text: "text-zinc-700 dark:text-zinc-400",
        border: "border-zinc-200 dark:border-zinc-800",
        dot: "bg-zinc-500",
      };
  }
}

/**
 * Normalise un produit en extrayant son original_price (colonne native ou fallback tag)
 */
export function parseProduct(p: any): Product {
  if (!p) return p;
  let original_price =
    p.original_price != null && Number(p.original_price) > 0
      ? Number(p.original_price)
      : null;
  let description = p.description || "";

  // Si pas de colonne native en BDD, vérifier le tag transparent <!--PROMO:15000-->
  if (!original_price && description) {
    const match = description.match(/<!--PROMO:([0-9.]+)-->/);
    if (match && match[1]) {
      original_price = Number(match[1]);
      description = description.replace(/<!--PROMO:[0-9.]+-->\s*/, "").trim();
    }
  }

  return {
    ...p,
    description,
    original_price: original_price && original_price > 0 ? original_price : null,
  };
}

export function parseProducts(list: any[]): Product[] {
  if (!list || !Array.isArray(list)) return [];
  return list.map(parseProduct);
}

