import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Empêche toute mise en cache statique par Next.js ou Vercel
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Route GET /api/keep-alive
 * Tâche planifiée pour maintenir le projet Supabase Free actif (empêche la mise en veille après 7 jours).
 * Interroge réellement la table 'products' avec en-têtes anti-cache stricts.
 */
export async function GET(req: NextRequest) {
  // Sécurisation optionnelle : si CRON_SECRET est configuré sur Vercel, on le vérifie
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Non autorisé : CRON_SECRET invalide" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  const startTime = Date.now();

  try {
    const supabase = createAdminClient();

    // Requête réelle vers la base de données PostgreSQL
    // On sélectionne 1 produit pour vérifier la connectivité sans surcharger la bande passante
    const { data, error, count } = await supabase
      .from("products")
      .select("id, name, created_at", { count: "exact" })
      .limit(1);

    if (error) {
      console.error("[Keep-Alive Error]:", error);
      return NextResponse.json(
        {
          success: false,
          status: "database_error",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        status: "active",
        message: "Supabase keep-alive exécuté avec succès. Base de données active.",
        timestamp: new Date().toISOString(),
        durationMs,
        productsCount: count,
        sampleProduct: data && data.length > 0 ? data[0].name : null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("[Keep-Alive Exception]:", err);
    return NextResponse.json(
      {
        success: false,
        status: "exception",
        error: err.message || "Erreur interne",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
