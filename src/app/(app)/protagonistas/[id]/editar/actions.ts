"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function updateProtagonistaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("ID inválido.");

  const payload = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    rama: String(formData.get("rama") ?? "").trim(),
    fecha_nacimiento: String(formData.get("fecha_nacimiento") ?? "").trim(),
    domicilio: String(formData.get("domicilio") ?? "").trim(),
    dni: Number(formData.get("dni") ?? 0),
  };

  const { error } = await supabase.from("protagonistas").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  // ✅ vuelve al listado con mensaje
  redirect(`/protagonistas?toast=${encodeURIComponent("Cambios guardados")}`);
}

export async function setProtagonistaActivoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const activo = String(formData.get("activo")) === "true";
  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase.from("protagonistas").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);

  redirect(
    `/protagonistas?toast=${encodeURIComponent(
      activo ? "Protagonista reactivado" : "Protagonista dado de baja"
    )}`
  );
}
