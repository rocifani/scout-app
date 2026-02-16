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

function back(ventaId: number | null, productoId: number | null, toast: string) {
  const params = new URLSearchParams();
  if (ventaId) params.set("venta", String(ventaId));
  if (productoId) params.set("producto", String(productoId));
  params.set("toast", toast);
  redirect(`/admin/ventas-compras?${params.toString()}`);
}

/* ================================
   CREAR COMPRA (SIEMPRE INSERT)
   - ventas_compras
================================= */
export async function createVentaCompraLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const tipo = toTipo(formData.get("comprador_tipo"));

  const id_protagonista = toInt(formData.get("id_protagonista"));
  const id_educador = toInt(formData.get("id_educador"));

  const cantidad = toInt(formData.get("cantidad"));
  const pago = String(formData.get("pago") ?? "") === "on";

  if (!ventaId || !id_venta_detalle) back(ventaId, id_venta_detalle, "IDs inválidos");
  if (!cantidad || cantidad <= 0) back(ventaId, id_venta_detalle, "La cantidad debe ser mayor a 0.");

  if (tipo === "protagonista" && !id_protagonista) back(ventaId, id_venta_detalle, "Falta protagonista");
  if (tipo === "educador" && !id_educador) back(ventaId, id_venta_detalle, "Falta educador");

  const payload: any = {
    id_venta_detalle,
    comprador_tipo: tipo,
    cantidad,
    pago,
    id_protagonista: tipo === "protagonista" ? id_protagonista : null,
    id_educador: tipo === "educador" ? id_educador : null,
  };

  const { error } = await supabase.from("ventas_compras").insert(payload);
  if (error) back(ventaId, id_venta_detalle, `Error creando: ${error.message}`);

  back(ventaId, id_venta_detalle, "Compra agregada");
}

/* ================================
   MARCAR PAGO (PARCIAL)
================================= */
export async function setVentaCompraPagoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const lineId = toInt(formData.get("line_id"));
  const tipo = toTipo(formData.get("comprador_tipo"));
  const pago = String(formData.get("pago") ?? "") === "true";

  if (!ventaId || !id_venta_detalle || !lineId) back(ventaId, id_venta_detalle, "IDs inválidos");

  const { error } = await supabase
    .from("ventas_compras")
    .update({ pago })
    .eq("id", lineId)
    .eq("comprador_tipo", tipo);

  if (error) back(ventaId, id_venta_detalle, `Error actualizando: ${error.message}`);

  back(ventaId, id_venta_detalle, pago ? "Compra marcada como pagada" : "Compra marcada como pendiente");
}

/* ================================
   BORRAR
================================= */
export async function deleteVentaCompraLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const lineId = toInt(formData.get("line_id"));
  const tipo = toTipo(formData.get("comprador_tipo"));

  if (!ventaId || !id_venta_detalle || !lineId) back(ventaId, id_venta_detalle, "IDs inválidos");

  const { error } = await supabase
    .from("ventas_compras")
    .delete()
    .eq("id", lineId)
    .eq("comprador_tipo", tipo);

  if (error) back(ventaId, id_venta_detalle, `Error borrando: ${error.message}`);

  back(ventaId, id_venta_detalle, "Compra eliminada");
}
