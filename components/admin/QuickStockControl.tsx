"use client";

import React, { useState } from "react";
import { Plus, Minus, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface QuickStockControlProps {
  productId: string;
  initialStock: number;
  onStockUpdated: (newStock: number) => void;
}

export function QuickStockControl({
  productId,
  initialStock,
  onStockUpdated,
}: QuickStockControlProps) {
  const [stock, setStock] = useState(initialStock);
  const [isUpdating, setIsUpdating] = useState(false);
  const { error } = useToast();

  const handleUpdate = async (delta: number) => {
    const targetStock = Math.max(0, stock + delta);
    if (targetStock === stock) return;

    setStock(targetStock);
    setIsUpdating(true);

    try {
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: targetStock, updated_at: new Date().toISOString() })
        .eq("id", productId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      onStockUpdated(targetStock);
    } catch (err: any) {
      setStock(stock); // Rollback
      error(err.message || "Erreur de mise à jour du stock", "Erreur");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick +/- buttons */}
      <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => handleUpdate(-1)}
          disabled={isUpdating || stock <= 0}
          className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Diminuer de 1"
        >
          <Minus className="w-3 h-3" />
        </button>

        <span
          className={cn(
            "w-8 text-center text-xs font-bold font-mono",
            stock === 0 && "text-rose-600 dark:text-rose-400",
            stock > 0 && stock < 5 && "text-amber-600 dark:text-amber-400",
            stock >= 5 && "text-zinc-900 dark:text-zinc-100"
          )}
        >
          {stock}
        </span>

        <button
          onClick={() => handleUpdate(1)}
          disabled={isUpdating}
          className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
          title="Augmenter de 1"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Low stock warning indicator */}
      {stock > 0 && stock < 5 && (
        <span
          title="Alerte : Stock critique (< 5 articles)"
          className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}
