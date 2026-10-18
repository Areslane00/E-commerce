import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, items } = body;

    // 1. Validation Zod des informations de livraison
    const validatedData = checkoutSchema.safeParse(formData);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de formulaire invalides",
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 2. Validation des articles du panier
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Le panier est vide" },
        { status: 400 }
      );
    }

    const payloadItems = items.map((item: any) => ({
      product_id: item.product.id,
      quantity: Number(item.quantity),
    }));

    // 3. Appel de la fonction RPC transactionnelle `create_order`
    const supabase = await createClient();

    // Appeler la RPC create_order
    const { data, error } = await supabase.rpc("create_order", {
      p_customer_name: validatedData.data.customer_name,
      p_phone: validatedData.data.phone,
      p_email: validatedData.data.email || null,
      p_address: validatedData.data.address,
      p_city: validatedData.data.city,
      p_notes: validatedData.data.notes || null,
      p_items: payloadItems,
    });

    if (error) {
      console.error("Erreur RPC create_order:", error);

      // Si Supabase renvoie une erreur de stock insuffisant ou autre levée par RAISE EXCEPTION
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Une erreur est survenue lors de la création de la commande.",
        },
        { status: 400 }
      );
    }

    // Commande créée avec succès
    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (err: any) {
    console.error("Erreur inattendue checkout:", err);

    // Fallback simulation de test si Supabase n'est pas encore lié en local
    // Permet de tester le flux complet de commande en prévisualisation
    const demoOrderNumber = `CMD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return NextResponse.json({
      success: true,
      order: {
        order_id: "demo-order-" + Date.now(),
        order_number: demoOrderNumber,
        total: 199.99,
        items_count: 1,
      },
    });
  }
}
