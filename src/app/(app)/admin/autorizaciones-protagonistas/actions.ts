"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function marcarAutorizacionEntregadaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase
    .from("autorizaciones_protagonistas")
    .update({ entregada: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/autorizaciones-protagonistas");
}

export async function marcarAutorizacionNoEntregadaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase
    .from("autorizaciones_protagonistas")
    .update({ entregada: false })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/autorizaciones-protagonistas");
}
