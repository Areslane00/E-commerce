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
import { parseProduct } from "@/lib/utils";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  Star,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: (product: Product, isNew: boolean) => void;
}

const DEFAULT_CATEGORIES = ["Smartphones & Tech", "Électroménager", "Maison & Cuisine", "Mode & Chaussures", "Beauté & Parfums", "Bricolage & Auto", "Sport & Loisirs", "Autre"];

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductModalProps) {
  const isEditing = Boolean(product);
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState<Partial<ProductFormValues> & { images?: string[] }>({
    name: "",
    description: "",
    price: 0,
    original_price: null,
    category: "Smartphones & Tech",
    stock: 10,
    image_url: "",
    images: [],
  });

  const [urlInput, setUrlInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      const parsed = parseProduct(product);
      const initialImages = (parsed.images && parsed.images.length > 0
        ? parsed.images
        : parsed.image_url
        ? [parsed.image_url]
        : []
      ).filter(Boolean);

      setFormData({
        name: parsed.name,
        description: parsed.description || "",
        price: Number(parsed.price),
        original_price: parsed.original_price ? Number(parsed.original_price) : null,
        category: parsed.category,
        stock: parsed.stock,
        image_url: initialImages[0] || "",
        images: initialImages,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        original_price: null,
        category: "Smartphones & Tech",
        stock: 10,
        image_url: "",
        images: [],
      });
    }
    setUrlInput("");
    setErrors({});
  }, [product, isOpen]);

  // Upload d'une ou plusieurs photos simultanément vers Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Téléversement de 0/${files.length}...`);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Téléversement de ${i + 1}/${files.length} (${file.name})...`);

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Échec pour "${file.name}"`);
        }

        uploadedUrls.push(data.url);
      }

      setFormData((prev) => {
        const currentImages = prev.images || [];
        const newImages = [...currentImages, ...uploadedUrls];
        return {
          ...prev,
          images: newImages,
          image_url: newImages[0] || "",
        };
      });

      success(
        `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""} ajoutée${uploadedUrls.length > 1 ? "s" : ""} avec succès !`,
        "Photos téléversées"
      );
    } catch (err: any) {
      toastError(err.message || "Erreur lors du téléversement.", "Erreur Storage");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  // Ajouter une photo via son URL
  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toastError("Veuillez saisir une URL d'image valide commençant par http:// ou https://", "URL invalide");
      return;
    }

    setFormData((prev) => {
      const currentImages = prev.images || [];
      const newImages = [...currentImages, url];
      return {
        ...prev,
        images: newImages,
        image_url: newImages[0] || "",
      };
    });

    setUrlInput("");
    success("Photo ajoutée via URL avec succès.", "Photo ajoutée");
  };

  // Supprimer une photo de la liste
  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const newImages = (prev.images || []).filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: newImages,
        image_url: newImages[0] || "",
      };
    });
  };

  // Définir une photo comme photo principale (index 0)
  const handleSetPrimary = (indexToPrimary: number) => {
    setFormData((prev) => {
      const current = [...(prev.images || [])];
      if (indexToPrimary < 0 || indexToPrimary >= current.length) return prev;
      const [item] = current.splice(indexToPrimary, 1);
      current.unshift(item);
      return {
        ...prev,
        images: current,
        image_url: current[0] || "",
      };
    });
    success("Cette photo a été définie comme photo principale de l'article.", "Photo principale");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const imagesList = (formData.images || []).filter(Boolean);
    const primaryImageUrl = imagesList[0] || formData.image_url || "";

    const dataToValidate = {
      ...formData,
      image_url: primaryImageUrl || undefined,
      images: imagesList,
    };

    const validated = productSchema.safeParse(dataToValidate);
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
      const cleanDesc = (validated.data.description || "")
        .replace(/<!--PROMO:[0-9.]+-->\s*/, "")
        .replace(/<!--IMAGES:.+?-->\s*/, "")
        .trim();

      const promoTag =
        validated.data.original_price && Number(validated.data.original_price) > 0
          ? `<!--PROMO:${Number(validated.data.original_price)}-->\n`
          : "";

      const imagesTag =
        imagesList.length > 0
          ? `<!--IMAGES:${JSON.stringify(imagesList)}-->\n`
          : "";

      const finalDescription = `${promoTag}${imagesTag}${cleanDesc}`.trim();

      const payload: any = {
        name: validated.data.name,
        description: finalDescription || null,
        price: validated.data.price,
        category: validated.data.category,
        stock: validated.data.stock,
        image_url: primaryImageUrl || null,
        images: imagesList,
      };

      if (validated.data.original_price && Number(validated.data.original_price) > 0) {
        payload.original_price = Number(validated.data.original_price);
      } else {
        payload.original_price = null;
      }

      let savedProduct: Product | null = null;

      const executeSave = async (dataPayload: any) => {
        if (isEditing && product) {
          return await supabase
            .from("products")
            .update({ ...dataPayload, updated_at: new Date().toISOString() })
            .eq("id", product.id)
            .select()
            .single();
        } else {
          return await supabase
            .from("products")
            .insert(dataPayload)
            .select()
            .single();
        }
      };

      let res = await executeSave(payload);

      // Si erreur de colonne manquante en BDD Supabase (images ou original_price)
      if (res.error && (res.error.message.includes("images") || res.error.message.includes("original_price"))) {
        const fallbackPayload = { ...payload };
        if (res.error.message.includes("images")) {
          delete fallbackPayload.images;
        }
        if (res.error.message.includes("original_price")) {
          delete fallbackPayload.original_price;
        }
        res = await executeSave(fallbackPayload);
      }

      if (res.error) {
        throw new Error(res.error.message);
      }

      savedProduct = parseProduct(res.data);
      if (savedProduct) {
        // Garantir que les photos locales fraîchement configurées sont conservées dans le state
        savedProduct.images = imagesList;
        savedProduct.image_url = primaryImageUrl || null;
      }

      success(
        isEditing
          ? `Le produit "${validated.data.name}" a été modifié avec succès.`
          : `Nouveau produit "${validated.data.name}" créé avec succès !`,
        isEditing ? "Produit mis à jour" : "Produit créé"
      );

      if (savedProduct) onSuccess(savedProduct, !isEditing);
      onClose();
    } catch (err: any) {
      console.error("Erreur enregistrement produit:", err);
      toastError(err.message || "Erreur lors de l'enregistrement", "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const images = formData.images || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier l'article" : "Ajouter un nouvel article"}
      description="Remplissez les détails ci-dessous. Vous pouvez ajouter une ou plusieurs photos pour chaque article."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom du produit */}
        <Input
          id="name"
          label="Nom de l'article *"
          placeholder="Ex: Samsung Galaxy S24 Ultra"
          value={formData.name || ""}
          error={errors.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Prix, Promo, Catégorie, Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            id="price"
            type="number"
            step="0.01"
            label="Prix de vente (DZD) *"
            placeholder="15000"
            value={formData.price !== undefined ? formData.price : ""}
            error={errors.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />

          <Input
            id="original_price"
            type="number"
            step="0.01"
            label="Prix avant promo (DZD)"
            placeholder="18000"
            value={formData.original_price !== undefined && formData.original_price !== null ? formData.original_price : ""}
            error={errors.original_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                original_price: e.target.value === "" ? null : parseFloat(e.target.value) || null,
              })
            }
          />

          <div className="space-y-1">
            <label
              htmlFor="category"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            >
              Catégorie *
            </label>
            <select
              id="category"
              value={formData.category || "Smartphones & Tech"}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
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
            label="Quantité en Stock *"
            placeholder="10"
            value={formData.stock !== undefined ? formData.stock : ""}
            error={errors.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Description détaillée de l'article
          </label>
          <textarea
            rows={3}
            value={formData.description || ""}
            placeholder="Caractéristiques techniques, dimensions, garantie, détails du produit..."
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 bg-white/70 dark:bg-zinc-900/70 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 dark:border-zinc-800 text-foreground"
          />
        </div>

        {/* Section Photos Multiples */}
        <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-750 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Photos de l'article ({images.length} photo{images.length > 1 ? "s" : ""})
                </h4>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Vous pouvez ajouter une ou plusieurs photos. La 1ère photo avec l'étoile est la photo principale.
              </p>
            </div>

            {/* Bouton d'upload multiple */}
            <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-sm">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <UploadCloud className="w-4 h-4 text-emerald-600" />
              )}
              <span>{isUploading ? (uploadProgress || "Téléversement...") : "Téléverser des photos"}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Formulaire d'ajout rapide par URL */}
          <div className="flex gap-2">
            <Input
              id="imageUrlInput"
              placeholder="Ou collez l'URL d'une image (https://...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUrl}
              className="gap-1.5 whitespace-nowrap h-11 px-3.5 font-semibold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </Button>
          </div>

          {/* Grille de prévisualisation des photos */}
          {images.length === 0 ? (
            <div className="py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
              <ImageIcon className="w-8 h-8 mb-1 stroke-[1.5]" />
              <p className="text-xs font-medium">Aucune photo ajoutée pour cet article</p>
              <p className="text-[10px] text-zinc-400">Téléversez des fichiers ou renseignez une URL ci-dessus</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
              {images.map((imgUrl, index) => {
                const isPrimary = index === 0;
                return (
                  <div
                    key={`${imgUrl}-${index}`}
                    className={`group relative aspect-square rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 border-2 transition-all ${
                      isPrimary
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />

                    {/* Badge photo principale */}
                    {isPrimary && (
                      <div className="absolute top-1 left-1 z-10">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Principale</span>
                        </span>
                      </div>
                    )}

                    {/* Overlay d'actions au survol */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                          title="Supprimer cette photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(index)}
                          className="w-full py-1 px-1 rounded-md bg-white text-zinc-900 text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                          <Star className="w-3 h-3 text-emerald-600" />
                          <span>Mettre en 1er</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Boutons d'action du formulaire */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="font-bold">
            {isEditing ? "Enregistrer les modifications" : "Créer le produit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
