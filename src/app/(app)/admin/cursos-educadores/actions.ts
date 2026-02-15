"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;
type Rama = (typeof RAMAS)[number];

function parseRama(raw: string): Rama | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  return (RAMAS as readonly string[]).includes(v) ? (v as Rama) : null;
}

export async function createCursoEducadorAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id_educador = Number(formData.get("id_educador"));
  const id_curso = Number(formData.get("id_curso"));
  const ramaRaw = String(formData.get("rama") ?? "");
  const rama = parseRama(ramaRaw);

  if (!id_educador || !id_curso) throw new Error("Faltan datos.");

  // si mandan una rama inválida (no coincide con el enum)
  if (ramaRaw.trim() && !rama) {
    throw new Error("Rama inválida. Elegí una opción del listado.");
  }

  // ✅ evitar duplicado exacto (educador + curso + rama)
  let q = supabase
    .from("cursos_educadores")
    .select("id")
    .eq("id_educador", id_educador)
    .eq("id_curso", id_curso);

  if (rama) q = q.eq("rama", rama);
  else q = q.is("rama", null);

  const { data: existente, error: selErr } = await q.maybeSingle();

  if (selErr) throw new Error(selErr.message);
  if (existente?.id) throw new Error("Ese curso ya está registrado para ese educador (misma rama).");

  const { error } = await supabase.from("cursos_educadores").insert({
    id_educador,
    id_curso,
    rama, // null o enum
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/cursos-educadores?toast=${encodeURIComponent("Curso registrado")}`);
}

export async function updateCursoEducadorAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const id_educador = Number(formData.get("id_educador"));
  const id_curso = Number(formData.get("id_curso"));
  const ramaRaw = String(formData.get("rama") ?? "");
  const rama = parseRama(ramaRaw);

  if (!id || !id_educador || !id_curso) throw new Error("Datos inválidos.");

  if (ramaRaw.trim() && !rama) {
    throw new Error("Rama inválida. Elegí una opción del listado.");
  }

  // ✅ evitar que al editar quede duplicado con otro registro
  let q = supabase
    .from("cursos_educadores")
    .select("id")
    .eq("id_educador", id_educador)
    .eq("id_curso", id_curso)
    .neq("id", id);

  if (rama) q = q.eq("rama", rama);
  else q = q.is("rama", null);

  const { data: existente, error: selErr } = await q.maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existente?.id) throw new Error("Ya existe otro registro con ese educador, curso y rama.");

  const { error } = await supabase
    .from("cursos_educadores")
    .update({ id_educador, id_curso, rama })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/admin/cursos-educadores?toast=${encodeURIComponent("Cambios guardados")}`);
}

export async function deleteCursoEducadorAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase.from("cursos_educadores").delete().eq("id", id);
  if (error) throw new Error(error.message);

  redirect(`/admin/cursos-educadores?toast=${encodeURIComponent("Registro eliminado")}`);
}
