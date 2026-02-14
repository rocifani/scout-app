"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

type UpdateProtagonistaInput = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  domicilio: string;
  dni: number;
};

export async function updateProtagonista(input: UpdateProtagonistaInput) {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("protagonistas")
    .update({
      nombre: input.nombre,
      apellido: input.apellido,
      rama: input.rama,
      fecha_nacimiento: input.fecha_nacimiento,
      domicilio: input.domicilio,
      dni: input.dni,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidatePath("/protagonistas");
  revalidatePath(`/protagonistas/${input.id}/editar`);
}

export async function setProtagonistaActivo(id: number, activo: boolean) {
  const supabase = await createSupabaseServer();

  const { error } = await supabase.from("protagonistas").update({ activo }).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protagonistas");
  revalidatePath(`/protagonistas/${id}/editar`);
}
