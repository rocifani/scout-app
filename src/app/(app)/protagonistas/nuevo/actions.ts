"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createProtagonista(formData: FormData) {
  const supabase = await createSupabaseServer();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "");
  const dni = Number(formData.get("dni") ?? 0);
  const domicilio = String(formData.get("domicilio") ?? "").trim();

  if (!nombre || !apellido || !rama || !fecha_nacimiento || !dni || !domicilio) {
    throw new Error("Faltan datos obligatorios.");
  }

  const { error } = await supabase.from("protagonistas").insert({
    nombre,
    apellido,
    rama,
    fecha_nacimiento,
    dni,
    domicilio,
    activo: true,
  });

  if (error) throw new Error(error.message);

  redirect("/protagonistas");
}
