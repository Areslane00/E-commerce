"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import { Product } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import { ALGERIA_WILAYAS } from "@/lib/algeriaWilayas";
import { checkoutSchema, CheckoutFormValues } from "@/lib/validations";
import {
  Zap,
  ShoppingBag,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Banknote,
} from "lucide-react";

interface DirectOrderModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
}

export function DirectOrderModal({
  product,
  isOpen,
  onClose,
  initialQuantity = 1,
}: DirectOrderModalProps) {
  const router = useRouter();
  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const { success, error: toastError } = useToast();

  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted && lang === "ar";

  useEffect(() => {
    if (product) {
      setQuantity(initialQuantity > 0 ? Math.min(initialQuantity, product.stock || 1) : 1);
      setServerError(null);
    }
  }, [product, initialQuantity, isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      wilaya: "",
      commune: "",
      notes: "",
    },
  });

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const unitPrice = Number(product.price);
  const totalPrice = unitPrice * quantity;
  const mainImage = (product.images && product.images.length > 0 ? product.images[0] : product.image_url) || null;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (isOutOfStock) {
      toastError(
        isAr ? "عذراً، هذا المنتج غير متوفر حالياً." : "Ce produit est actuellement en rupture de stock.",
        isAr ? "تنبيه" : "Stock épuisé"
      );
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: data,
          items: [
            {
              product: {
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
              },
              quantity,
            },
          ],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de la commande.");
      }

      const orderData = result.order;
      const orderNumber =
        orderData?.order_number ||
        "CMD-" + Math.floor(Math.random() * 90000 + 10000);

      // Animation confetti festive
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignorer si non disponible
      }

      success(
        isAr
          ? `تم تأكيد طلبك بنجاح ! رقم الطلب : ${orderNumber}`
          : `Votre commande a été enregistrée avec succès ! N° ${orderNumber}`,
        isAr ? "طلب مؤكد" : "Commande confirmée"
      );

      reset();
      onClose();

      // Redirection immédiate vers la page de confirmation
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (err: any) {
      console.error("Erreur commande directe:", err);
      setServerError(err.message || "Erreur lors de la validation de la commande.");
      toastError(err.message || "Impossible de valider la commande.", isAr ? "خطأ" : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? "طلب مباشر وسريع للمنتج" : "Commander cet article directement"}
      description={
        isAr
          ? "أدخل معلومات التوصيل الخاصة بك أدناه لتأكيد طلبك فورياً بدون المرور بالسلة."
          : "Renseignez vos coordonnées de livraison ci-dessous pour commander directement sans passer par le panier."
      }
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Résumé express du produit */}
        <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 border border-zinc-200 dark:border-zinc-600">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 mb-1">
                {product.category}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {product.name}
              </h4>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isAr ? "سعر القطعة:" : "Prix unitaire :"} <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formatPrice(unitPrice)}</span>
              </div>
            </div>

            {/* Sélecteur de quantité rapide & Total */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                  aria-label="Diminuer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                  aria-label="Augmenter"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right rtl:text-left">
                <div className="text-[10px] uppercase font-bold text-zinc-400">
                  {isAr ? "المجموع" : "Total à régler"}
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Avantages livraison & paiement */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
            <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{isAr ? "توصيل 58 ولاية (مجاني)" : "Livraison 58 Wilayas (Gratuite)"}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-300">
            <Banknote className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold">{isAr ? "الدفع نقداً عند الاستلام" : "Paiement à la livraison (Cash)"}</span>
          </div>
        </div>

        {/* Message d'erreur serveur si existant */}
        {serverError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Formulaire de livraison rapide */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="customer_name"
              label={isAr ? "الاسم الكامل *" : "Nom et prénom *"}
              placeholder={isAr ? "مثال: محمد بن علي" : "Ex: Mohamed Benali"}
              error={errors.customer_name?.message}
              {...register("customer_name")}
            />

            <Input
              id="phone"
              type="tel"
              label={isAr ? "رقم الهاتف *" : "Numéro de téléphone *"}
              placeholder="05 / 06 / 07 XX XX XX"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sélection Wilaya */}
            <div className="space-y-1">
              <label
                htmlFor="wilaya"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                {isAr ? "الولاية *" : "Wilaya de livraison *"}
              </label>
              <select
                id="wilaya"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                {...register("wilaya")}
              >
                <option value="">{isAr ? "-- اختر ولايتك --" : "-- Choisissez votre Wilaya --"}</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.name}>
                    {isAr ? w.nameAr : w.name}
                  </option>
                ))}
              </select>
              {errors.wilaya && (
                <p className="text-xs text-rose-500 font-medium">{errors.wilaya.message}</p>
              )}
            </div>

            <Input
              id="commune"
              label={isAr ? "البلدية *" : "Commune *"}
              placeholder={isAr ? "مثال: باب الزوار، الشراقة..." : "Ex: Bab Ezzouar, Cheraga..."}
              error={errors.commune?.message}
              {...register("commune")}
            />
          </div>

          <Input
            id="address"
            label={isAr ? "عنوان التوصيل الدقيق (الحي، الشارع، رقم المنزل) *" : "Adresse de livraison exacte (Quartier, Rue, N°) *"}
            placeholder={isAr ? "مثال: حي 500 مسكن عمارة ب رقم 12" : "Ex: Cité 500 logts, Bâtiment B N° 12"}
            error={errors.address?.message}
            {...register("address")}
          />

          <Input
            id="notes"
            label={isAr ? "ملاحظة للموزع (اختياري)" : "Instructions pour le livreur (optionnel)"}
            placeholder={isAr ? "مثال: الاتصال قبل القدوم بساعة" : "Ex: Appeler 1h avant la livraison..."}
            error={errors.notes?.message}
            {...register("notes")}
          />

          {/* Boutons d'action */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </Button>

            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isOutOfStock}
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
            >
              <Zap className="w-4 h-4 fill-current flex-shrink-0" />
              <span>
                {isAr
                  ? `تأكيد الطلب الآن (${formatPrice(totalPrice)})`
                  : `Confirmer la commande (${formatPrice(totalPrice)})`}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
