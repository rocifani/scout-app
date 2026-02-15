"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function createCursoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const nombre_curso = String(formData.get("nombre_curso") ?? "").trim();
  if (!nombre_curso) throw new Error("Falta el nombre del curso.");

  const { error } = await supabase.from("cursos").insert({
    nombre_curso,
    sistema_actual: true,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/cursos?toast=${encodeURIComponent("Curso creado")}`);
}
