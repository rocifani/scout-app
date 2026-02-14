"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function updateEducadorAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("ID inválido.");

  const payload = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    dni: Number(formData.get("dni") ?? 0),
    fecha_nacimiento: String(formData.get("fecha_nacimiento") ?? "").trim(),
    domicilio: String(formData.get("domicilio") ?? "").trim(),
    rama: String(formData.get("rama") ?? "").trim(),
    cargo: String(formData.get("cargo") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    telefono: Number(formData.get("telefono") ?? 0),
  };

  const { error } = await supabase
    .from("educadores")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/educadores?toast=${encodeURIComponent("Cambios guardados")}`);
}

export async function setEducadorActivoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const activo = String(formData.get("activo")) === "true";

  if (!id) throw new Error("ID inválido.");

  const { error } = await supabase
    .from("educadores")
    .update({ activo })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(
    `/educadores?toast=${encodeURIComponent(
      activo ? "Educador reactivado" : "Educador dado de baja"
    )}`
  );
}
