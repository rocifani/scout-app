"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // SOLO server
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function createAutorizacionAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const nombre_autorizacion = String(formData.get("nombre_autorizacion") ?? "").trim();
  if (!nombre_autorizacion) throw new Error("Falta el nombre de la autorización.");

  // 1) Crear autorización (con id de vuelta)
  const { data: authRow, error: insErr } = await supabaseAdmin
    .from("autorizaciones")
    .insert({
      nombre_autorizacion,
      activo: true,
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);
  const autorizacionId = authRow?.id;
  if (!autorizacionId) throw new Error("No se pudo obtener el id de la autorización.");

  // 2) Backfill: crear autorizaciones_protagonistas para todos los protagonistas (año actual)
  const anio = new Date().getFullYear();

  const { data: protas, error: pErr } = await supabaseAdmin
    .from("protagonistas")
    .select("id")
    .eq("activo", true);

  if (pErr) throw new Error(pErr.message);

  const rows = (protas ?? []).map((p) => ({
    id_protagonista: p.id,
    id_autorizacion: autorizacionId,
    anio_vigencia: anio,
    entregada: false,
  }));

  if (rows.length > 0) {
    // ✅ Requiere UNIQUE(id_protagonista,id_autorizacion,anio_vigencia) para que no duplique
    const { error: upErr } = await supabaseAdmin
      .from("autorizaciones_protagonistas")
      .upsert(rows, {
        onConflict: "id_protagonista,id_autorizacion,anio_vigencia",
        ignoreDuplicates: true,
      });

    if (upErr) throw new Error(upErr.message);
  }

  redirect(`/admin/autorizaciones?toast=${encodeURIComponent("Autorización creada")}`);
}
