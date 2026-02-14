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

export async function updatePadreYRelacionAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const idProtagonista = Number(formData.get("id_protagonista"));
  const idPadre = Number(formData.get("id_padre"));
  const idPP = Number(formData.get("id_padre_protagonista"));

  if (!idProtagonista || !idPadre || !idPP) throw new Error("IDs inválidos.");

  const padrePayload = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    telefono: Number(formData.get("telefono") ?? 0) || null,
    email: String(formData.get("email") ?? "").trim() || null,
    dni: Number(formData.get("dni") ?? 0),
  };

  const relacionPayload = {
    relacion: String(formData.get("relacion") ?? "").trim() || null,
  };

  // 1) update padre
  const { error: e1 } = await supabase.from("padres").update(padrePayload).eq("id", idPadre);
  if (e1) throw new Error(e1.message);

  // 2) update relación (por id del registro en padres_protagonistas)
  const { error: e2 } = await supabase
    .from("padres_protagonistas")
    .update(relacionPayload)
    .eq("id", idPP);

  if (e2) throw new Error(e2.message);

  redirect(
  `/protagonistas?toast=${encodeURIComponent("Padre actualizado")}`
);

}