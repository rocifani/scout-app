"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // SOLO server
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Permisos: si el usuario logueado existe en "educadores", puede administrar.
async function assertIsEducador() {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("No autenticado.");

  const { data: edu, error } = await supabase
    .from("educadores")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!edu) throw new Error("No tenés permisos (solo educadores).");

  return { userId: auth.user.id };
}

const DEFAULT_VALORES_RETURN_TO = "/admin/valores";
const DEFAULT_CUOTAS_RETURN_TO = "/admin/cuotas";

// Crear nuevo valor de cuota / afiliación
export async function crearNuevoValorCuotaAction(formData: FormData) {
  await assertIsEducador();
  const supabaseAdmin = getSupabaseAdmin();

  const tipo = String(formData.get("tipo") ?? "").trim(); // 'cuota' | 'afiliacion'
  const valor = Number(formData.get("valor") ?? 0);
  const returnTo = String(formData.get("returnTo") || DEFAULT_VALORES_RETURN_TO);

  if (!["cuota", "afiliacion"].includes(tipo)) throw new Error("Tipo inválido.");
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("Valor inválido.");

  const { error } = await supabaseAdmin.rpc("crear_valor_y_actualizar_cuotas", {
    p_tipo: tipo,
    p_valor: valor,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/valores");
  revalidatePath("/admin/cuotas");
  redirect(returnTo);
}

// Marcar cuota como pagada
export async function marcarCuotaPagadaAction(formData: FormData) {
  await assertIsEducador();
  const supabaseAdmin = getSupabaseAdmin();

  const cuotaId = Number(formData.get("cuota_id"));
  const returnTo = String(formData.get("returnTo") || DEFAULT_CUOTAS_RETURN_TO);

  if (!Number.isFinite(cuotaId) || cuotaId <= 0) {
    throw new Error("cuota_id inválido.");
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { error } = await supabaseAdmin
    .from("cuotas")
    .update({ fecha_pago: today })
    .eq("id", cuotaId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/cuotas");
  redirect(returnTo);
}

// Marcar cuota como impaga
export async function marcarCuotaImpagaAction(formData: FormData) {
  await assertIsEducador();
  const supabaseAdmin = getSupabaseAdmin();

  const cuotaId = Number(formData.get("cuota_id"));
  const returnTo = String(formData.get("returnTo") || DEFAULT_CUOTAS_RETURN_TO);

  if (!Number.isFinite(cuotaId) || cuotaId <= 0) {
    throw new Error("cuota_id inválido.");
  }

  const { error } = await supabaseAdmin
    .from("cuotas")
    .update({ fecha_pago: null })
    .eq("id", cuotaId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/cuotas");
  redirect(returnTo);
}