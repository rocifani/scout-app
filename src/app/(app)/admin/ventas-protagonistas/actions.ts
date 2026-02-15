"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

function toInt(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function back(ventaId: number | null, productoId: number | null, toast: string) {
  const params = new URLSearchParams();
  if (ventaId) params.set("venta", String(ventaId));
  if (productoId) params.set("producto", String(productoId));
  params.set("toast", toast);
  redirect(`/admin/ventas-protagonistas?${params.toString()}`);
}

/* ================================
   CREAR COMPRA (SIEMPRE INSERT)
   - permite múltiples compras
================================= */
export async function createVentaProtagonistaLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const id_protagonista = toInt(formData.get("id_protagonista"));
  const cantidad = toInt(formData.get("cantidad"));
  const pago = String(formData.get("pago") ?? "") === "on";

  if (!ventaId || !id_venta_detalle || !id_protagonista) {
    back(ventaId, id_venta_detalle, "IDs inválidos");
  }
  if (!cantidad || cantidad <= 0) {
    back(ventaId, id_venta_detalle, "La cantidad debe ser mayor a 0.");
  }

  const { error } = await supabase.from("ventas_protagonistas").insert({
    id_venta_detalle,
    id_protagonista,
    cantidad,
    pago,
  });

  if (error) back(ventaId, id_venta_detalle, `Error creando: ${error.message}`);

  back(ventaId, id_venta_detalle, "Compra agregada");
}

/* ================================
   MARCAR PAGO (PARCIAL)
   - actualiza una fila puntual
================================= */
export async function setVentaProtagonistaPagoAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const lineId = toInt(formData.get("line_id"));
  const pago = String(formData.get("pago") ?? "") === "true";

  if (!ventaId || !id_venta_detalle || !lineId) {
    back(ventaId, id_venta_detalle, "IDs inválidos");
  }

  const { error } = await supabase
    .from("ventas_protagonistas")
    .update({ pago })
    .eq("id", lineId);

  if (error) back(ventaId, id_venta_detalle, `Error actualizando: ${error.message}`);

  back(ventaId, id_venta_detalle, pago ? "Compra marcada como pagada" : "Compra marcada como pendiente");
}

/* ================================
   BORRAR
================================= */
export async function deleteVentaProtagonistaLineAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const ventaId = toInt(formData.get("venta_id"));
  const id_venta_detalle = toInt(formData.get("id_venta_detalle"));
  const lineId = toInt(formData.get("line_id"));

  if (!ventaId || !id_venta_detalle || !lineId) {
    back(ventaId, id_venta_detalle, "IDs inválidos");
  }

  const { error } = await supabase.from("ventas_protagonistas").delete().eq("id", lineId);

  if (error) back(ventaId, id_venta_detalle, `Error borrando: ${error.message}`);

  back(ventaId, id_venta_detalle, "Compra eliminada");
}
