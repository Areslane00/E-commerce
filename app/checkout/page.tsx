"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/components/ui/Toast";
import { checkoutSchema, CheckoutFormValues } from "@/lib/validations";
import { formatPrice } from "@/lib/utils";
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Banknote,
  ShoppingBag,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const { error: toastError, success: toastSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toastError("Votre panier est vide.", "Impossible de commander");
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
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de la commande.");
      }

      const orderData = result.order;
      const orderNumber = orderData?.order_number || "NOVA-" + Math.floor(Math.random() * 90000 + 10000);

      // Vider le panier après commande réussie
      clearCart();
      toastSuccess("Votre commande a été enregistrée avec succès !", "Succès");

      // Redirection vers la page de confirmation
      router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}?name=${encodeURIComponent(data.customer_name)}&total=${orderData?.total || totalPrice}`);
    } catch (err: any) {
      setServerError(err.message || "Erreur de connexion au serveur.");
      toastError(err.message || "Une erreur est survenue.", "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Votre panier est vide</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Ajoutez au moins un article avant de pouvoir finaliser votre commande.
          </p>
          <Link href="/">
            <Button>Retourner à la boutique</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Modifier mon panier
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
          Finaliser la commande
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8">
          Renseignez vos coordonnées de livraison. Vous paierez en espèces à la réception de votre colis.
        </p>

        {serverError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold">Impossible de valider votre commande</p>
              <p className="mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Checkout Form */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-2 pb-5 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <Truck className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Informations de Livraison
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="customer_name"
                  label="Nom complet *"
                  placeholder="ex: Jean Dupont"
                  error={errors.customer_name?.message}
                  {...register("customer_name")}
                />

                <Input
                  id="phone"
                  label="Numéro de Téléphone *"
                  placeholder="ex: 06 12 34 56 78"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>

              <Input
                id="email"
                type="email"
                label="Email (optionnel pour confirmation)"
                placeholder="ex: jean.dupont@email.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    id="address"
                    label="Adresse de livraison *"
                    placeholder="Rue, bâtiment, numéro de porte..."
                    error={errors.address?.message}
                    {...register("address")}
                  />
                </div>
                <div>
                  <Input
                    id="city"
                    label="Ville *"
                    placeholder="ex: Paris, Lyon..."
                    error={errors.city?.message}
                    {...register("city")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
                >
                  Instructions pour le livreur (optionnel)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Code d'entrée, créneau d'appel souhaité, etc."
                  className="w-full rounded-xl border border-zinc-200 bg-white/70 dark:bg-zinc-900/70 p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 dark:border-zinc-800 text-foreground"
                  {...register("notes")}
                />
              </div>

              {/* Cash On Delivery Confirmation */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Mode de paiement : En espèces à la livraison
                  </h4>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Vous réglerez le montant exact directement auprès du livreur lors de la remise de votre commande.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-bold shadow-lg shadow-zinc-900/10 dark:shadow-none"
              >
                Confirmer la commande ({formatPrice(totalPrice)})
              </Button>
            </form>
          </div>

          {/* Cart Review Side Panel */}
          <div className="lg:col-span-5 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 space-y-5">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Articles commandés ({totalItems})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-xs"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {product.name}
                    </p>
                    <p className="text-zinc-400 text-[11px]">Qté : {quantity}</p>
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatPrice(product.price * quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Sous-total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Livraison</span>
                <span className="text-emerald-600 font-bold">Gratuite</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline font-bold text-sm">
                <span>Total à régler</span>
                <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Vos informations personnelles sont protégées et chiffrées.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
