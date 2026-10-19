"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { formatPrice, cn, parseProduct } from "@/lib/utils";
import { ProductModal } from "./ProductModal";
import { QuickStockControl } from "./QuickStockControl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Video as VideoIcon,
} from "lucide-react";

interface ProductsManagerProps {
  initialProducts: Product[];
}

export function ProductsManager({ initialProducts }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  // Extract categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // Filtered products (avec produits en stock disponibles affichés en premier)
  const filteredProducts = products
    .filter((p) => {
      const matchesCat =
        categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      const aInStock = a.stock > 0 ? 1 : 0;
      const bInStock = b.stock > 0 ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;
      return 0;
    });

  // Handle Add/Edit modal success
  const handleProductSuccess = (updatedProduct: Product, isNew: boolean) => {
    const parsed = parseProduct(updatedProduct);
    if (isNew) {
      setProducts((prev) => [parsed, ...prev]);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === parsed.id ? parsed : p))
      );
    }
  };

  // Handle Quick stock update
  const handleStockUpdated = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      success(`Le produit "${productToDelete.name}" a été supprimé.`, "Produit supprimé");
      setProductToDelete(null);
    } catch (err: any) {
      error(err.message || "Erreur lors de la suppression.", "Erreur");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Search, Category Filter and Add Product Button */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder=""
            className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Toutes les catégories" : c}
              </option>
            ))}
          </select>

          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="gap-2 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Aucun produit trouvé
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
              Aucun article ne correspond à votre recherche.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-850/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Produit</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Prix</th>
                  <th className="py-3.5 px-4">Stock & Ajustement</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock < 5;

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition-colors",
                        isOutOfStock && "bg-rose-50/20 dark:bg-rose-950/10"
                      )}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="44px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                            {product.images && product.images.length > 1 && (
                              <div className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded-tl shadow-sm">
                                {product.images.length}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5 flex-wrap">
                              <span>{product.name}</span>
                              {product.images && product.images.length > 1 && (
                                <span className="inline-block text-[10px] text-zinc-400 font-normal">
                                  ({product.images.length} photos)
                                </span>
                              )}
                              {product.videos && product.videos.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                                  <VideoIcon className="w-2.5 h-2.5" />
                                  <span>{product.videos.length} vid</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 line-clamp-1">
                              {product.description || "Pas de description"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          {product.original_price && product.original_price > product.price && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-rose-500 uppercase">
                                Promo
                              </span>
                              <span className="text-[11px] line-through text-zinc-400 font-semibold">
                                {formatPrice(product.original_price)}
                              </span>
                            </div>
                          )}
                          <span className="font-bold text-zinc-900 dark:text-zinc-50">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </td>

                      {/* Stock & Quick Adjustment Buttons */}
                      <td className="py-3.5 px-4">
                        <QuickStockControl
                          productId={product.id}
                          initialStock={product.stock}
                          onStockUpdated={(newStock) =>
                            handleStockUpdated(product.id, newStock)
                          }
                        />
                      </td>

                      {/* Status indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            Terminé
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Faible ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Disponible
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSuccess={handleProductSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer définitivement ce produit ? Cette action est irréversible."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          {productToDelete && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 text-xs">
              <span className="font-bold block text-zinc-900 dark:text-zinc-100">
                {productToDelete.name}
              </span>
              <span className="text-zinc-500">
                {formatPrice(productToDelete.price)} • Stock : {productToDelete.stock}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={isDeleting}
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
