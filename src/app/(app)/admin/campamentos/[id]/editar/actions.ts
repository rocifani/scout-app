"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function updateCampamentoAction(id: string, formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const fecha_inicio = String(formData.get("fecha_inicio") ?? "").trim();
  const fecha_fin    = String(formData.get("fecha_fin")    ?? "").trim();
  const hora_inicio  = String(formData.get("hora_inicio")  ?? "").trim();
  const hora_fin     = String(formData.get("hora_fin")     ?? "").trim();
  const lugar        = String(formData.get("lugar")        ?? "").trim();
  const costo        = parseFloat(String(formData.get("costo") ?? "0"));

  if (!fecha_inicio) throw new Error("Falta la fecha de inicio.");
  if (!fecha_fin)    throw new Error("Falta la fecha de fin.");
  if (!hora_inicio)  throw new Error("Falta la hora de inicio.");
  if (!hora_fin)     throw new Error("Falta la hora de fin.");
  if (!lugar)        throw new Error("Falta el lugar.");
  if (isNaN(costo))  throw new Error("El costo no es válido.");

  const { error } = await supabaseAdmin
    .from("campamentos")
    .update({ fecha_inicio, fecha_fin, hora_inicio, hora_fin, lugar, costo })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/admin/campamentos?toast=${encodeURIComponent("Campamento actualizado")}`);
}

export async function deleteCampamentoAction(id: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("campamentos")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/admin/campamentos?toast=${encodeURIComponent("Campamento eliminado")}`);
}