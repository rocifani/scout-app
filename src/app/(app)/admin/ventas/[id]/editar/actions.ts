"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

function toNullIfEmpty(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function toNumberOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function updateVentaCabeceraAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) {
    redirect(`/admin/ventas?toast=${encodeURIComponent("ID inválido")}`);
  }

  const nombre_venta = toNullIfEmpty(formData.get("nombre_venta"));
  const fecha_inicio = toNullIfEmpty(formData.get("fecha_inicio"));
  const fecha_fin = toNullIfEmpty(formData.get("fecha_fin"));

  if (!nombre_venta) {
    redirect(`/admin/ventas/${id}/editar?toast=${encodeURIComponent("Falta el nombre")}`);
  }

  if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) {
    redirect(`/admin/ventas/${id}/editar?toast=${encodeURIComponent("La fecha fin no puede ser menor a la fecha inicio")}`);
  }

  const { error } = await supabase
    .from("ventas_cabecera")
    .update({ nombre_venta, fecha_inicio, fecha_fin })
    .eq("id", id);

  if (error) {
    redirect(`/admin/ventas/${id}/editar?toast=${encodeURIComponent(`Error: ${error.message}`)}`);
  }

  redirect(`/admin/ventas/${id}/editar?toast=${encodeURIComponent("Venta actualizada")}`);
}

export async function createVentaDetalleAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id_ventas_cabecera = Number(formData.get("id_ventas_cabecera"));
  if (!id_ventas_cabecera) {
    redirect(`/admin/ventas?toast=${encodeURIComponent("ID de venta inválido")}`);
  }

  const nombre_producto = toNullIfEmpty(formData.get("nombre_producto"));
  if (!nombre_producto) {
    redirect(`/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent("Falta el nombre del producto")}`);
  }

  const precio = toNumberOrNull(formData.get("precio"));
  const costo = toNumberOrNull(formData.get("costo"));
  const ganancia_individual = toNumberOrNull(formData.get("ganancia_individual"));
  const ganancia_grupo = toNumberOrNull(formData.get("ganancia_grupo"));

  const { error } = await supabase.from("ventas_detalle").insert({
    id_ventas_cabecera,
    nombre_producto,
    precio,
    costo,
    ganancia_individual,
    ganancia_grupo,
  });

  if (error) {
    redirect(
      `/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent(
        `Error agregando producto: ${error.message}`
      )}`
    );
  }

  redirect(`/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent("Producto agregado")}`);
}

export async function updateVentaDetalleAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const id_ventas_cabecera = Number(formData.get("id_ventas_cabecera"));
  if (!id || !id_ventas_cabecera) {
    redirect(`/admin/ventas?toast=${encodeURIComponent("IDs inválidos")}`);
  }

  const nombre_producto = toNullIfEmpty(formData.get("nombre_producto"));
  if (!nombre_producto) {
    redirect(`/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent("Falta el nombre del producto")}`);
  }

  const precio = toNumberOrNull(formData.get("precio"));
  const costo = toNumberOrNull(formData.get("costo"));
  const ganancia_individual = toNumberOrNull(formData.get("ganancia_individual"));
  const ganancia_grupo = toNumberOrNull(formData.get("ganancia_grupo"));

  const { error } = await supabase
    .from("ventas_detalle")
    .update({
      nombre_producto,
      precio,
      costo,
      ganancia_individual,
      ganancia_grupo,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent(
        `Error actualizando producto: ${error.message}`
      )}`
    );
  }

  redirect(`/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent("Producto actualizado")}`);
}

export async function deleteVentaDetalleAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = Number(formData.get("id"));
  const id_ventas_cabecera = Number(formData.get("id_ventas_cabecera"));

  if (!id || !id_ventas_cabecera) {
    redirect(`/admin/ventas?toast=${encodeURIComponent("IDs inválidos")}`);
  }

  // Bloquear si ya hay ventas_protagonistas asociadas
  const { count, error: cntErr } = await supabase
    .from("ventas_compras")
    .select("id", { count: "exact", head: true })
    .eq("id_venta_detalle", id);

  if (cntErr) {
    redirect(
      `/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent(
        `No se pudo validar ventas asociadas: ${cntErr.message}`
      )}`
    );
  }

  if ((count ?? 0) > 0) {
    redirect(
      `/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent(
        "No podés eliminar este producto porque ya tiene ventas cargadas."
      )}`
    );
  }

  const { error } = await supabase.from("ventas_detalle").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent(
        `Error eliminando producto: ${error.message}`
      )}`
    );
  }

  redirect(`/admin/ventas/${id_ventas_cabecera}/editar?toast=${encodeURIComponent("Producto eliminado")}`);
}
