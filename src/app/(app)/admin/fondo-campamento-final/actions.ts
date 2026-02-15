"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function parseMoney(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export async function createFondoCampamentoAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const id_protagonista = Number(formData.get("id_protagonista"));
  const montoRaw = String(formData.get("monto") ?? "");
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  const monto = parseMoney(montoRaw);

  if (!id_protagonista || monto === null || monto < 0) {
    redirect(`/admin/fondo-campamento-final?toast=${encodeURIComponent("Datos inválidos")}`);
  }

  const { error } = await supabaseAdmin.from("fondo_campamento_final").insert({
    id_protagonista,
    monto,
    observaciones,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/fondo-campamento-final?toast=${encodeURIComponent("Aporte guardada")}`);
}

export async function deleteFondoCampamentoAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();
  const id = Number(formData.get("id"));

  if (!id) redirect(`/admin/fondo-campamento-final?toast=${encodeURIComponent("ID inválido")}`);

  const { error } = await supabaseAdmin.from("fondo_campamento_final").delete().eq("id", id);
  if (error) throw new Error(error.message);

  redirect(`/admin/fondo-campamento-final?toast=${encodeURIComponent("Aporte borrada")}`);
}
