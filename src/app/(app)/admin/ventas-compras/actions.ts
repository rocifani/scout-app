// ✅ Archivo: src/app/(app)/admin/ventas-compras/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type CompradorTipo = "protagonista" | "educador" | "grupo";

function toInt(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toTipo(v: FormDataEntryValue | null): CompradorTipo {
  const s = String(v ?? "").trim();
  if (s === "educador" || s === "grupo") return s;
  return "protagonista";
}

// ✅ ahora preserva producto="all" o producto="<id>"
function back(ventaId: number | null, productoKey: string | null, toast: string) {
  const params = new URLSearchParams();
  if (ventaId) params.set("venta", String(ventaId));
  if (productoKey) params.set("producto", productoKey);
  params.set("toast", toast);
  redirect(`/admin/ventas-compras?${params.toString()}`);
}

/* ================================
   CREAR COMPRA (SIEMPRE INSERT)
================================= */
export async function createVentaCompraLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const productoKey = String(formData.get("producto") ?? "").trim() || null;

  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const tipo = toTipo(formData.get("comprador_tipo"));

  const id_protagonista = toInt(formData.get("id_protagonista"));
  const id_educador = toInt(formData.get("id_educador"));

  const cantidad = toInt(formData.get("cantidad"));
  const pago = String(formData.get("pago") ?? "") === "on";

  if (!ventaId) back(null, productoKey, "Falta venta");
  if (!id_venta_detalle) back(ventaId, productoKey, "Falta producto");
  if (!cantidad || cantidad <= 0) back(ventaId, productoKey, "La cantidad debe ser mayor a 0.");

  if (tipo === "protagonista" && !id_protagonista) back(ventaId, productoKey, "Falta protagonista");
  if (tipo === "educador" && !id_educador) back(ventaId, productoKey, "Falta educador");

  const payload: any = {
    id_venta_detalle,
    comprador_tipo: tipo,
    cantidad,
    pago,
    id_protagonista: tipo === "protagonista" ? id_protagonista : null,
    id_educador: tipo === "educador" ? id_educador : null,
  };

  const { error } = await supabase.from("ventas_compras").insert(payload);
  if (error) back(ventaId, productoKey, `Error creando: ${error.message}`);

  back(ventaId, productoKey, "Compra agregada");
}

/* ================================
   MARCAR PAGO (1 línea)
================================= */
export async function setVentaCompraPagoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const productoKey = String(formData.get("producto") ?? "").trim() || null;

  const lineId = toInt(formData.get("line_id"));
  const tipo = toTipo(formData.get("comprador_tipo"));
  const pago = String(formData.get("pago") ?? "") === "true";

  if (!ventaId || !lineId) back(ventaId, productoKey, "IDs inválidos");

  const { error } = await supabase
    .from("ventas_compras")
    .update({ pago })
    .eq("id", lineId)
    .eq("comprador_tipo", tipo);

  if (error) back(ventaId, productoKey, `Error actualizando: ${error.message}`);

  back(ventaId, productoKey, pago ? "Compra marcada como pagada" : "Compra marcada como pendiente");
}

/* ================================
   BORRAR (1 línea)
================================= */
export async function deleteVentaCompraLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const productoKey = String(formData.get("producto") ?? "").trim() || null;

  const lineId = toInt(formData.get("line_id"));
  const tipo = toTipo(formData.get("comprador_tipo"));

  if (!ventaId || !lineId) back(ventaId, productoKey, "IDs inválidos");

  const { error } = await supabase.from("ventas_compras").delete().eq("id", lineId).eq("comprador_tipo", tipo);

  if (error) back(ventaId, productoKey, `Error borrando: ${error.message}`);

  back(ventaId, productoKey, "Compra eliminada");
}

/* ================================
   ✅ OPCIÓN A: MARCAR TODA LA VENTA (por persona)
================================= */
export async function setVentaPagoAllForPersonaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const productoKey = String(formData.get("producto") ?? "").trim() || null;

  const tipo = toTipo(formData.get("comprador_tipo"));
  const pago = String(formData.get("pago") ?? "") === "true";

  const id_protagonista = toInt(formData.get("id_protagonista"));
  const id_educador = toInt(formData.get("id_educador"));

  if (!ventaId) back(null, productoKey, "Falta venta");

  if (tipo === "protagonista" && !id_protagonista) back(ventaId, productoKey, "Falta protagonista");
  if (tipo === "educador" && !id_educador) back(ventaId, productoKey, "Falta educador");

  // 1) Traer todos los productos de la venta
  const { data: dets, error: detErr } = await supabase
    .from("ventas_detalle")
    .select("id")
    .eq("id_ventas_cabecera", ventaId);

  if (detErr) back(ventaId, productoKey, `Error leyendo productos: ${detErr.message}`);

  const ids = (dets ?? [])
    .map((d: any) => Number(d.id))
    .filter((x: number) => Number.isFinite(x) && x > 0);

  if (ids.length === 0) back(ventaId, productoKey, "La venta no tiene productos.");

  // 2) Update masivo en ventas_compras para esa persona y esa venta
  let qy = supabase
    .from("ventas_compras")
    .update({ pago })
    .eq("comprador_tipo", tipo)
    .in("id_venta_detalle", ids);

  if (tipo === "protagonista") qy = qy.eq("id_protagonista", id_protagonista);
  if (tipo === "educador") qy = qy.eq("id_educador", id_educador);
  // grupo: no filtra por id

  const { error: upErr } = await qy;
  if (upErr) back(ventaId, productoKey, `Error actualizando: ${upErr.message}`);

  back(ventaId, productoKey, pago ? "Venta marcada como pagada (persona)" : "Venta marcada como pendiente (persona)");
}
