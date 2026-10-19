import { z } from "zod";

export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères")
    .max(80, "Le nom ne doit pas dépasser 80 caractères"),
  phone: z
    .string()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres")
    .regex(/^[0-9+\s\-().]{8,20}$/, "Format de numéro de téléphone invalide"),
  email: z
    .string()
    .email("Adresse email invalide")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(3, "L'adresse complète de livraison est requise")
    .max(200, "L'adresse ne doit pas dépasser 200 caractères"),
  wilaya: z
    .string()
    .min(2, "Veuillez sélectionner ou renseigner votre Wilaya"),
  commune: z
    .string()
    .min(2, "Veuillez renseigner votre Commune")
    .max(80, "La commune ne doit pas dépasser 80 caractères"),
  city: z
    .string()
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Les instructions ne doivent pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom du produit est obligatoire")
    .max(120, "Le nom ne doit pas dépasser 120 caractères"),
  description: z
    .string()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
  price: z
    .coerce
    .number({ invalid_type_error: "Le prix doit être un nombre valide" })
    .positive("Le prix doit être supérieur à 0"),
  original_price: z
    .coerce
    .number({ invalid_type_error: "Le prix avant promo doit être un nombre valide" })
    .positive("Le prix avant promo doit être supérieur à 0")
    .optional()
    .nullable()
    .or(z.literal("")),
  category: z
    .string()
    .min(2, "La catégorie est obligatoire"),
  stock: z
    .coerce
    .number({ invalid_type_error: "Le stock doit être un entier" })
    .int("Le stock doit être un nombre entier")
    .min(0, "Le stock ne peut pas être négatif"),
  image_url: z
    .string()
    .url("L'URL de l'image est invalide")
    .optional()
    .or(z.literal("")),
  images: z
    .array(z.string().url("URL de photo invalide"))
    .optional()
    .default([]),
  videos: z
    .array(z.string())
    .optional()
    .default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
