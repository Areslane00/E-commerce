"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase/client";
import { loginSchema, LoginFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";
  const authErrorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authErrorParam === "unauthorized"
      ? "Accès réservé aux administrateurs. Veuillez vous connecter avec un compte admin."
      : null
  );

  const { success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw new Error(signInError.message || "Identifiants invalides");
      }

      if (!authData.user) {
        throw new Error("Impossible de récupérer la session.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Ce compte ne dispose pas des privilèges administrateur.");
      }

      success("Connexion réussie ! Redirection en cours...", "Bienvenue");
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      const msg = err.message || "Erreur de connexion.";
      setErrorMessage(msg);
      error(msg, "Échec de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 mx-auto flex items-center justify-center shadow-md">
          <ShieldCheck className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          Espace Administrateur
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Connectez-vous pour gérer les commandes, stocks et analytics.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="Email Administrateur"
          placeholder="admin@votredomaine.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          id="password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full font-bold shadow-lg shadow-zinc-900/10 dark:shadow-none mt-2"
        >
          Se connecter à l&apos;administration
        </Button>
      </form>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Pour créer votre premier admin, inscrivez un utilisateur puis exécutez la requête SQL :
          <br />
          <code className="text-zinc-600 dark:text-zinc-300 font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded mt-1 inline-block">
            UPDATE profiles SET role = &apos;admin&apos; WHERE email = &apos;...&apos;;
          </code>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la boutique
      </Link>

      <Suspense fallback={<div className="text-xs text-zinc-400">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
