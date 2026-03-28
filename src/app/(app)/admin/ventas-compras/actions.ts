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

function back(returnTo: string | null, toast: string) {
  const safeReturnTo =
    returnTo && returnTo.startsWith("/admin/ventas-compras")
      ? returnTo
      : "/admin/ventas-compras";

  const url = new URL(safeReturnTo, "http://localhost");
  url.searchParams.set("toast", toast);

  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

export async function createVentaCompraLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const returnTo = String(formData.get("returnTo") ?? "").trim() || null;
  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const tipo = toTipo(formData.get("comprador_tipo"));

  const id_protagonista = toInt(formData.get("id_protagonista"));
  const id_educador = toInt(formData.get("id_educador"));

  const cantidad = toInt(formData.get("cantidad"));
  const pago = String(formData.get("pago") ?? "") === "on";

  if (!ventaId) back(returnTo, "Falta venta");
  if (!id_venta_detalle) back(returnTo, "Falta producto");
  if (!cantidad || cantidad <= 0) back(returnTo, "La cantidad debe ser mayor a 0.");

  if (tipo === "protagonista" && !id_protagonista) back(returnTo, "Falta protagonista");
  if (tipo === "educador" && !id_educador) back(returnTo, "Falta educador");

  const payload = {
    id_venta_detalle,
    comprador_tipo: tipo,
    cantidad,
    pago,
    id_protagonista: tipo === "protagonista" ? id_protagonista : null,
    id_educador: tipo === "educador" ? id_educador : null,
  };

  const { error } = await supabase.from("ventas_compras").insert(payload);
  if (error) back(returnTo, `Error creando: ${error.message}`);

  back(returnTo, "Compra agregada");
}

export async function setVentaCompraPagoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const returnTo = String(formData.get("returnTo") ?? "").trim() || null;
  const ventaId = toInt(formData.get("venta_id"));
  const lineId = toInt(formData.get("line_id"));
  const tipo = toTipo(formData.get("comprador_tipo"));
  const pago = String(formData.get("pago") ?? "") === "true";

  if (!ventaId || !lineId) back(returnTo, "IDs inválidos");

  const { error } = await supabase
    .from("ventas_compras")
    .update({ pago })
    .eq("id", lineId)
    .eq("comprador_tipo", tipo);

  if (error) back(returnTo, `Error actualizando: ${error.message}`);

  back(returnTo, pago ? "Compra marcada como pagada" : "Compra marcada como pendiente");
}

export async function deleteVentaCompraLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const returnTo = String(formData.get("returnTo") ?? "").trim() || null;
  const ventaId = toInt(formData.get("venta_id"));
  const lineId = toInt(formData.get("line_id"));
  const tipo = toTipo(formData.get("comprador_tipo"));

  if (!ventaId || !lineId) back(returnTo, "IDs inválidos");

  const { error } = await supabase
    .from("ventas_compras")
    .delete()
    .eq("id", lineId)
    .eq("comprador_tipo", tipo);

  if (error) back(returnTo, `Error borrando: ${error.message}`);

  back(returnTo, "Compra eliminada");
}

export async function setVentaPagoAllForPersonaAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const returnTo = String(formData.get("returnTo") ?? "").trim() || null;
  const ventaId = toInt(formData.get("venta_id"));

  const tipo = toTipo(formData.get("comprador_tipo"));
  const pago = String(formData.get("pago") ?? "") === "true";

  const id_protagonista = toInt(formData.get("id_protagonista"));
  const id_educador = toInt(formData.get("id_educador"));

  if (!ventaId) back(returnTo, "Falta venta");

  if (tipo === "protagonista" && !id_protagonista) back(returnTo, "Falta protagonista");
  if (tipo === "educador" && !id_educador) back(returnTo, "Falta educador");

  const { data: dets, error: detErr } = await supabase
    .from("ventas_detalle")
    .select("id")
    .eq("id_ventas_cabecera", ventaId);

  if (detErr) back(returnTo, `Error leyendo productos: ${detErr.message}`);

  const ids = (dets ?? [])
    .map((d: any) => Number(d.id))
    .filter((x: number) => Number.isFinite(x) && x > 0);

  if (ids.length === 0) back(returnTo, "La venta no tiene productos.");

  let qy = supabase
    .from("ventas_compras")
    .update({ pago })
    .eq("comprador_tipo", tipo)
    .in("id_venta_detalle", ids);

  if (tipo === "protagonista") qy = qy.eq("id_protagonista", id_protagonista);
  if (tipo === "educador") qy = qy.eq("id_educador", id_educador);

  const { error: upErr } = await qy;
  if (upErr) back(returnTo, `Error actualizando: ${upErr.message}`);

  back(
    returnTo,
    pago ? "Venta marcada como pagada (persona)" : "Venta marcada como pendiente (persona)"
  );
}