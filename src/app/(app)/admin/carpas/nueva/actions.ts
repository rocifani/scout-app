"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // SOLO server
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function toNullIfEmpty(v: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

export async function createCarpaAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const numeroRaw = toNullIfEmpty(formData.get("numero_carpa") as string | null);
  const numero_carpa = numeroRaw ? Number(numeroRaw) : null;

  if (numeroRaw && (Number.isNaN(numero_carpa) || numero_carpa! < 0)) {
    throw new Error("El número de carpa debe ser un número válido.");
  }

  const observaciones = toNullIfEmpty(formData.get("observaciones") as string | null);
  const url_foto = toNullIfEmpty(formData.get("url_foto") as string | null);

  const { error } = await supabaseAdmin.from("carpas").insert({
    numero_carpa,
    observaciones,
    url_foto,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/carpas?toast=${encodeURIComponent("Carpa creada correctamente.")}`);
}
