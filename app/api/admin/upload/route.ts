import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    // Valider le type mime de l'image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Le fichier doit être une image valide." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier l'utilisateur connecté
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Utiliser le client admin pour l'upload dans le bucket product-images
    const adminSupabase = createAdminClient();

    const fileExt = file.name.split(".").pop();
    const cleanFileName = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("product-images")
      .upload(cleanFileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erreur upload Storage:", uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from("product-images").getPublicUrl(cleanFileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err: any) {
    console.error("Erreur serveur upload:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erreur lors de l'upload." },
      { status: 500 }
    );
  }
}
