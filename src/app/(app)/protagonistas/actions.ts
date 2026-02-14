"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

function toNumber(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const n = Number(String(value));
  return Number.isFinite(n) ? n : null;
}

export async function createProtagonista(formData: FormData) {
  const supabase = await createSupabaseServer();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const domicilio = String(formData.get("domicilio") ?? "").trim();
  const dni = toNumber(formData.get("dni"));

  if (!nombre || !apellido || !rama || !fecha_nacimiento || !domicilio || !dni) {
    return { ok: false, error: "Faltan campos obligatorios." };
  }

  const { error } = await supabase.from("protagonistas").insert({
    nombre,
    apellido,
    rama,
    fecha_nacimiento,
    domicilio,
    dni,
    activo: true,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/protagonistas");
  return { ok: true };
}

export async function updateProtagonista(id: number, formData: FormData) {
  const supabase = await createSupabaseServer();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const domicilio = String(formData.get("domicilio") ?? "").trim();
  const dni = toNumber(formData.get("dni"));

  if (!nombre || !apellido || !rama || !fecha_nacimiento || !domicilio || !dni) {
    return { ok: false, error: "Faltan campos obligatorios." };
  }

  const { error } = await supabase
    .from("protagonistas")
    .update({ nombre, apellido, rama, fecha_nacimiento, domicilio, dni })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/protagonistas");
  revalidatePath(`/protagonistas/${id}/editar`);
  return { ok: true };
}

export async function setProtagonistaActivo(id: number, activo: boolean) {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("protagonistas")
    .update({ activo })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/protagonistas");
  return { ok: true };
}
