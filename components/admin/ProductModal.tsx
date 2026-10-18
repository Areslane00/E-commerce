"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Product } from "@/types";
import { productSchema, ProductFormValues } from "@/lib/validations";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase/client";
import { UploadCloud, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: (product: Product, isNew: boolean) => void;
}

const DEFAULT_CATEGORIES = ["Audio", "Informatique", "Accessoires", "Maison", "Mode", "Autre"];

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductModalProps) {
  const isEditing = Boolean(product);
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState<Partial<ProductFormValues>>({
    name: "",
    description: "",
    price: 0,
    category: "Audio",
    stock: 10,
    image_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: Number(product.price),
        category: product.category,
        stock: product.stock,
        image_url: product.image_url || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "Audio",
        stock: 10,
        image_url: "",
      });
    }
    setErrors({});
  }, [product, isOpen]);

  // Handle image file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'upload de l'image.");
      }

      setFormData((prev) => ({ ...prev, image_url: data.url }));
      success("Image téléversée avec succès dans Supabase Storage", "Image ajoutée");
    } catch (err: any) {
      toastError(err.message || "Erreur lors de l'upload.", "Erreur Storage");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validated = productSchema.safeParse(formData);
    if (!validated.success) {
      const fieldErrors: Record<string, string> = {};
      validated.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        const { data, error } = await supabase
          .from("products")
          .update({
            name: validated.data.name,
            description: validated.data.description || null,
            price: validated.data.price,
            category: validated.data.category,
            stock: validated.data.stock,
            image_url: validated.data.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id)
          .select()
          .single();

        if (error) throw new Error(error.message);

        success(`Le produit "${validated.data.name}" a été modifié.`, "Produit mis à jour");
        onSuccess(data as Product, false);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: validated.data.name,
            description: validated.data.description || null,
            price: validated.data.price,
            category: validated.data.category,
            stock: validated.data.stock,
            image_url: validated.data.image_url || null,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        success(`Nouveau produit "${validated.data.name}" créé avec succès !`, "Produit créé");
        onSuccess(data as Product, true);
      }

      onClose();
    } catch (err: any) {
      toastError(err.message || "Erreur lors de l'enregistrement", "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier le produit" : "Ajouter un nouveau produit"}
      description="Remplissez les détails ci-dessous. Le stock et le statut s'actualiseront automatiquement."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Nom du produit *"
          placeholder="ex: Casque Audio Nova Pro"
          value={formData.name || ""}
          error={errors.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="price"
            type="number"
            step="0.01"
            label="Prix (€) *"
            placeholder="129.99"
            value={formData.price !== undefined ? formData.price : ""}
            error={errors.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Catégorie *
            </label>
            <select
              value={formData.category || "Audio"}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white/70 dark:bg-zinc-900/70 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 dark:border-zinc-800 text-foreground"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="stock"
            type="number"
            label="Stock disponible *"
            placeholder="10"
            value={formData.stock !== undefined ? formData.stock : ""}
            error={errors.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description || ""}
            placeholder="Caractéristiques techniques, dimensions, garantie..."
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 bg-white/70 dark:bg-zinc-900/70 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 dark:border-zinc-800 text-foreground"
          />
        </div>

        {/* Image Upload & Preview Section */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Image du produit (Supabase Storage ou URL)
          </label>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Image Preview Box */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
              {formData.image_url ? (
                <>
                  <Image
                    src={formData.image_url}
                    alt="Aperçu produit"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-400" />
              )}
            </div>

            {/* Upload Button & Direct URL Input */}
            <div className="flex-1 space-y-2 w-full">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-emerald-500" />
                )}
                <span>{isUploading ? "Upload en cours..." : "Téléverser une image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <Input
                placeholder="Ou collez une URL d'image directe (https://...)"
                value={formData.image_url || ""}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                error={errors.image_url}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Enregistrer les modifications" : "Créer le produit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
