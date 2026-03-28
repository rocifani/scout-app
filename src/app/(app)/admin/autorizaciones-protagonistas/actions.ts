"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

const DEFAULT_RETURN_TO = "/admin/autorizaciones-protagonistas";

export async function marcarAutorizacionEntregadaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || DEFAULT_RETURN_TO);

  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase
    .from("autorizaciones_protagonistas")
    .update({ entregada: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(returnTo);
}

export async function marcarAutorizacionNoEntregadaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || DEFAULT_RETURN_TO);

  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase
    .from("autorizaciones_protagonistas")
    .update({ entregada: false })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(returnTo);
}