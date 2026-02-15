"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

function toNullIfEmpty(v: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

export async function updateCarpa(id: number, formData: FormData) {
  const supabase = await createSupabaseServer();

  const numeroRaw = toNullIfEmpty(formData.get("numero_carpa") as string | null);
  const numero_carpa = numeroRaw ? Number(numeroRaw) : null;

  if (numeroRaw && (Number.isNaN(numero_carpa) || numero_carpa! < 0)) {
    return { ok: false, error: "El número de carpa debe ser un número válido." };
  }

  const observaciones = toNullIfEmpty(formData.get("observaciones") as string | null);
  const url_foto = toNullIfEmpty(formData.get("url_foto") as string | null);

  const { error } = await supabase
    .from("carpas")
    .update({ numero_carpa, observaciones, url_foto })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  redirect(`/admin/carpas?toast=${encodeURIComponent("Carpa actualizada correctamente.")}`);
}

export async function deleteCarpa(id: number) {
  const supabase = await createSupabaseServer();

  const { error } = await supabase.from("carpas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  redirect(`/admin/carpas?toast=${encodeURIComponent("Carpa eliminada correctamente.")}`);
}
