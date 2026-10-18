"use client";

import React, { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  PhoneCall,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function ConfirmationContent({ orderNumber }: { orderNumber: string }) {
  const searchParams = useSearchParams();
  const customerName = searchParams?.get("name") || "Cher client";
  const rawTotal = searchParams?.get("total");
  const total = rawTotal ? parseFloat(rawTotal) : null;

  useEffect(() => {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#3b82f6", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#3b82f6", "#f59e0b"],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="w-full flex flex-col items-center text-center">
      {/* Animated Success Icon */}
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-6 animate-in zoom-in-75 duration-300 shadow-xl shadow-emerald-500/5">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold mb-3">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        Commande confirmée avec succès
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
        Merci pour votre commande, {customerName} !
      </h1>

      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
        Votre commande a bien été enregistrée et transmise à notre équipe logistique pour préparation immédiate.
      </p>

      {/* Order Details Card */}
      <div className="w-full mt-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
              Numéro de commande
            </span>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5 font-mono">
              {orderNumber}
            </div>
          </div>

          {total !== null && (
            <div className="sm:text-right">
              <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Montant à régler à la livraison
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatPrice(total)}
              </div>
            </div>
          )}
        </div>

        {/* Steps Timeline */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
            Prochaines étapes de votre livraison
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <PackageCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                1. Préparation
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Notre équipe emballe vos articles avec le plus grand soin.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <PhoneCall className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                2. Appel du livreur
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Le livreur vous contacte par téléphone avant son passage.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                3. Paiement en espèces
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Vérifiez le colis et réglez en espèces lors de la remise.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link href="/">
          <Button size="lg" className="gap-2 font-bold">
            Continuer mes achats
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const orderNumber = decodeURIComponent(params.id);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col items-center">
        <Suspense fallback={<div className="text-xs text-zinc-400">Chargement de la confirmation...</div>}>
          <ConfirmationContent orderNumber={orderNumber} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
