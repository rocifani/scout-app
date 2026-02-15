"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type DetallePayload = {
  nombre_producto: string;
  precio: number | null;
  costo: number | null;
  ganancia_individual: number | null;
  ganancia_grupo: number | null;
};

function toNullIfEmpty(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function toNumberOrNull(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createVentaConDetalles(formData: FormData) {
  const supabase = await createSupabaseServer();

  const nombre_venta = toNullIfEmpty(formData.get("nombre_venta"));
  const fecha_inicio = toNullIfEmpty(formData.get("fecha_inicio"));
  const fecha_fin = toNullIfEmpty(formData.get("fecha_fin"));

  const detallesJson = String(formData.get("detalles_json") ?? "[]");
  let detallesRaw: any[] = [];
  try {
    detallesRaw = JSON.parse(detallesJson);
  } catch {
    throw new Error("Detalle inválido.");
  }

  if (!nombre_venta) throw new Error("Falta el nombre de la venta.");
  if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) {
    throw new Error("La fecha fin no puede ser menor a la fecha inicio.");
  }

  if (!Array.isArray(detallesRaw) || detallesRaw.length < 1) {
    throw new Error("Tenés que cargar al menos 1 producto.");
  }

  const detalles: DetallePayload[] = detallesRaw.map((d) => ({
    nombre_producto: String(d?.nombre_producto ?? "").trim(),
    precio: toNumberOrNull(d?.precio),
    costo: toNumberOrNull(d?.costo),
    ganancia_individual: toNumberOrNull(d?.ganancia_individual),
    ganancia_grupo: toNumberOrNull(d?.ganancia_grupo),
  }));

  // Validación de productos
  for (const [i, d] of detalles.entries()) {
    if (!d.nombre_producto) throw new Error(`Producto #${i + 1}: falta el nombre.`);
    // precio/costo/ganancias pueden ser null si querés; si no, cambiamos a obligatorios
    if (d.precio !== null && d.precio < 0) throw new Error(`Producto #${i + 1}: precio inválido.`);
    if (d.costo !== null && d.costo < 0) throw new Error(`Producto #${i + 1}: costo inválido.`);
  }

  // 1) Insert cabecera (con ID)
  const { data: cab, error: cabErr } = await supabase
    .from("ventas_cabecera")
    .insert({ nombre_venta, fecha_inicio, fecha_fin })
    .select("id")
    .single();

  if (cabErr) throw new Error(cabErr.message);
  const cabeceraId = cab.id as number;

  // 2) Insert detalles
  const detalleRows = detalles.map((d) => ({
    id_ventas_cabecera: cabeceraId,
    nombre_producto: d.nombre_producto,
    precio: d.precio,
    costo: d.costo,
    ganancia_individual: d.ganancia_individual,
    ganancia_grupo: d.ganancia_grupo,
  }));

  const { error: detErr } = await supabase.from("ventas_detalle").insert(detalleRows);

  // Rollback manual si falla insertar detalle
  if (detErr) {
    await supabase.from("ventas_cabecera").delete().eq("id", cabeceraId);
    throw new Error(detErr.message);
  }

  redirect(
    `/admin/ventas?toast=${encodeURIComponent("Venta creada con sus productos.")}`
  );
}
