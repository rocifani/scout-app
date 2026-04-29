"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// — Protagonistas —

export async function toggleAsisteAction(
  idCampamento: string,
  idProtagonista: string,
  asiste: boolean
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("campamentos_protagonistas")
    .upsert(
      { id_campamento: idCampamento, id_protagonista: idProtagonista, asiste },
      { onConflict: "id_campamento,id_protagonista" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campamentos/${idCampamento}/detalle`);
}

export async function togglePagoAction(
  idCampamento: string,
  idProtagonista: string,
  pago: boolean
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("campamentos_protagonistas")
    .upsert(
      { id_campamento: idCampamento, id_protagonista: idProtagonista, pago },
      { onConflict: "id_campamento,id_protagonista" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campamentos/${idCampamento}/detalle`);
}

// — Gastos —

export async function createGastoAction(idCampamento: string, formData: FormData) {
  const supabase = getSupabaseAdmin();

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const monto = parseFloat(String(formData.get("monto") ?? "0"));

  if (!descripcion) throw new Error("Falta la descripción.");
  if (isNaN(monto) || monto <= 0) throw new Error("El monto no es válido.");

  const { error } = await supabase
    .from("campamentos_gastos")
    .insert({ id_campamento: idCampamento, descripcion, monto, pagado: false });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campamentos/${idCampamento}/detalle`);
}

export async function togglePagadoGastoAction(
  idCampamento: string,
  idGasto: string,
  pagado: boolean
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("campamentos_gastos")
    .update({ pagado })
    .eq("id", idGasto);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campamentos/${idCampamento}/detalle`);
}

export async function deleteGastoAction(idCampamento: string, idGasto: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("campamentos_gastos")
    .delete()
    .eq("id", idGasto);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campamentos/${idCampamento}/detalle`);
}