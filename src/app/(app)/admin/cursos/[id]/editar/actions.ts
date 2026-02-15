"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function updateCursoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const nombre_curso = String(formData.get("nombre_curso") ?? "").trim();

  if (!id) throw new Error("ID inválido.");
  if (!nombre_curso) throw new Error("Falta el nombre del curso.");

  const { error } = await supabase.from("cursos").update({ nombre_curso }).eq("id", id);
  if (error) throw new Error(error.message);

  redirect(`/admin/cursos?toast=${encodeURIComponent("Cambios guardados")}`);
}

export async function setCursoSistemaActualAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const sistema_actual = String(formData.get("sistema_actual")) === "true";

  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase.from("cursos").update({ sistema_actual }).eq("id", id);
  if (error) throw new Error(error.message);

  redirect(
    `/admin/cursos?toast=${encodeURIComponent(
      sistema_actual ? "Curso reactivado" : "Curso inactivado"
    )}`
  );
}
