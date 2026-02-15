import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  updateVentaCabeceraAction,
  createVentaDetalleAction,
  updateVentaDetalleAction,
  deleteVentaDetalleAction,
} from "./actions";

type VentaCabecera = {
  id: number;
  nombre_venta: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type VentaDetalle = {
  id: number;
  nombre_producto: string | null;
  precio: number | null;
  costo: number | null;
  ganancia_individual: number | null;
  ganancia_grupo: number | null;
};

function fmtMoney(n: number | null) {
  if (n === null || typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default async function EditarVentaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ toast?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;

  const ventaId = Number(id);
  if (!ventaId) return <div className="p-6 text-red-600">ID inválido.</div>;

  const supabase = await createSupabaseServer();

  // Cabecera
  const { data: cab, error: cabErr } = await supabase
    .from("ventas_cabecera")
    .select("id, nombre_venta, fecha_inicio, fecha_fin")
    .eq("id", ventaId)
    .single();

  if (cabErr) return <div className="p-6 text-red-600">Error venta: {cabErr.message}</div>;
  if (!cab) return <div className="p-6">No encontrado.</div>;

  // Detalles
  const { data: dets, error: detErr } = await supabase
    .from("ventas_detalle")
    .select("id, nombre_producto, precio, costo, ganancia_individual, ganancia_grupo")
    .eq("id_ventas_cabecera", ventaId)
    .order("created_at", { ascending: true });

  if (detErr) return <div className="p-6 text-red-600">Error productos: {detErr.message}</div>;

  const detalles = (dets ?? []) as VentaDetalle[];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/ventas" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              Editar venta
            </h1>
          </div>

      
        </div>

        {/* Cabecera */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Datos de la venta
          </h2>

          <form action={updateVentaCabeceraAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={cab.id} />

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
              <input
                name="nombre_venta"
                defaultValue={cab.nombre_venta ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Fecha inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                defaultValue={cab.fecha_inicio ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Fecha fin</label>
              <input
                type="date"
                name="fecha_fin"
                defaultValue={cab.fecha_fin ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-2">
              <Link
                href="/admin/ventas"
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                           text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </Link>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

        {/* Productos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Productos</h2>
          </div>

          {/* Agregar */}
          <form action={createVentaDetalleAction} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-5">
            <input type="hidden" name="id_ventas_cabecera" value={cab.id} />

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Producto</label>
              <input
                name="nombre_producto"
                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="Ej: Bono contribución"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Precio</label>
              <input
                name="precio"
                inputMode="decimal"
                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Costo</label>
              <input
                name="costo"
                inputMode="decimal"
                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Ganancia ind.</label>
              <input
                name="ganancia_individual"
                inputMode="decimal"
                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="0"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-9 w-full inline-flex items-center justify-center px-3 text-sm font-semibold rounded-lg
                           bg-[#FCDB52] text-gray-900
                           hover:bg-[#F3D146] active:bg-[#E9C83D]
                           focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              >
                Agregar
              </button>
            </div>

            <div className="md:col-span-2" />

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Ganancia grupo</label>
              <input
                name="ganancia_grupo"
                inputMode="decimal"
                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="0"
              />
            </div>
          </form>

          {/* Lista */}
          {detalles.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">No hay productos cargados todavía.</p>
          ) : (
            <div className="space-y-3">
              {detalles.map((d) => (
                <div key={d.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {d.nombre_producto ?? "Producto"}
                  </p>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Precio: {fmtMoney(d.precio)} · Costo: {fmtMoney(d.costo)} · Ganancia ind:{" "}
                    {fmtMoney(d.ganancia_individual)} · Ganancia grupo: {fmtMoney(d.ganancia_grupo)}
                  </p>

                  {/* Editar */}
                  <form action={updateVentaDetalleAction} className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-2">
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="id_ventas_cabecera" value={cab.id} />

                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Producto</label>
                      <input
                        name="nombre_producto"
                        defaultValue={d.nombre_producto ?? ""}
                        className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                   px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Precio</label>
                      <input
                        name="precio"
                        defaultValue={d.precio ?? ""}
                        inputMode="decimal"
                        className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                   px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Costo</label>
                      <input
                        name="costo"
                        defaultValue={d.costo ?? ""}
                        inputMode="decimal"
                        className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                   px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Ganancia ind.</label>
                      <input
                        name="ganancia_individual"
                        defaultValue={d.ganancia_individual ?? ""}
                        inputMode="decimal"
                        className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                   px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Ganancia grupo</label>
                      <input
                        name="ganancia_grupo"
                        defaultValue={d.ganancia_grupo ?? ""}
                        inputMode="decimal"
                        className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                   px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      />
                    </div>

                    <div className="md:col-span-6 flex justify-end gap-2 pt-1">
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold text-sm"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>

                  {/* Eliminar (form separado, sin anidar) */}
                  <form action={deleteVentaDetalleAction} className="flex justify-end mt-2">
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="id_ventas_cabecera" value={cab.id} />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-sm font-semibold"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
