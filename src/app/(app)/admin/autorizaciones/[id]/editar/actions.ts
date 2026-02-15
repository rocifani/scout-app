"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function updateAutorizacionAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const nombre_autorizacion = String(formData.get("nombre_autorizacion") ?? "").trim();

  if (!id) throw new Error("ID inválido.");
  if (!nombre_autorizacion) throw new Error("Falta el nombre de la autorización.");

  const { error } = await supabase
    .from("autorizaciones")
    .update({ nombre_autorizacion })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/admin/autorizaciones?toast=${encodeURIComponent("Cambios guardados")}`);
}

export async function setAutorizacionActivaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const activo = String(formData.get("activo")) === "true";

  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase
    .from("autorizaciones")
    .update({ activo })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(
    `/admin/autorizaciones?toast=${encodeURIComponent(activo ? "Autorización reactivada" : "Autorización dada de baja")}`
  );
}
