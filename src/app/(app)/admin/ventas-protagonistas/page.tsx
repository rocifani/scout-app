import Link from "next/link";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import VentasProtagonistasPicker from "@/components/VentasProtagonistasPicker";
import TableFilters from "@/components/TableFilters";
import {
  createVentaProtagonistaLineAction,
  deleteVentaProtagonistaLineAction,
  setVentaProtagonistaPagoAction,
} from "./actions";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;

type VentaCabecera = { id: number; nombre_venta: string | null };

type VentaDetalle = {
  id: number;
  id_ventas_cabecera: number | null;
  nombre_producto: string | null;
  precio: number | null;
  ganancia_individual: number | null;
  ganancia_grupo: number | null;
};

type Protagonista = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  activo: boolean;
};

type Linea = {
  id: number;
  id_protagonista: number;
  cantidad: number;
  pago: boolean;
  created_at: string;
};

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function formatARDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR");
}

export default async function VentasProtagonistasPage({
  searchParams,
}: {
  searchParams?: Promise<{
    toast?: string;
    venta?: string;
    producto?: string;
    q?: string;
    rama?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;

  const ventaId = sp.venta ? Number(sp.venta) : null;
  const productoId = sp.producto ? Number(sp.producto) : null;

  const q = (sp.q ?? "").trim();
  const rama = (sp.rama ?? "").trim();

  const supabase = await createSupabaseServerReadOnly();

  // 1) Ventas
  const { data: ventas, error: vErr } = await supabase
    .from("ventas_cabecera")
    .select("id, nombre_venta")
    .order("created_at", { ascending: false });

  if (vErr) return <div className="p-6 text-red-600">Error ventas: {vErr.message}</div>;
  const ventasRows = (ventas ?? []) as VentaCabecera[];

  // 2) Productos de la venta elegida
  let productosRows: VentaDetalle[] = [];
  if (ventaId) {
    const { data: dets, error: dErr } = await supabase
      .from("ventas_detalle")
      .select("id, id_ventas_cabecera, nombre_producto, precio, ganancia_individual, ganancia_grupo")
      .eq("id_ventas_cabecera", ventaId)
      .order("created_at", { ascending: true });

    if (dErr) return <div className="p-6 text-red-600">Error productos: {dErr.message}</div>;
    productosRows = (dets ?? []) as VentaDetalle[];
  }

  const selectedProductoId = productoId ?? (productosRows[0]?.id ?? null);
  const selectedProducto =
    selectedProductoId ? productosRows.find((p) => p.id === selectedProductoId) ?? null : null;

  // 3) Protagonistas activos + filtros
  let protasQuery = supabase
    .from("protagonistas")
    .select("id, nombre, apellido, rama, activo")
    .eq("activo", true);

  if (q) {
    const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    protasQuery = protasQuery.or(`nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`);
  }
  if (rama) {
    protasQuery = protasQuery.eq("rama", rama);
  }

  const { data: protas, error: pErr } = await protasQuery
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (pErr) return <div className="p-6 text-red-600">Error protagonistas: {pErr.message}</div>;
  const protagonistas = (protas ?? []) as Protagonista[];

  // 4) Líneas (todas las compras) del producto seleccionado
  const linesByProta = new Map<number, Linea[]>();

  if (selectedProductoId) {
    const { data: lines, error: lErr } = await supabase
      .from("ventas_protagonistas")
      .select("id, id_protagonista, cantidad, pago, created_at")
      .eq("id_venta_detalle", selectedProductoId)
      .order("created_at", { ascending: false });

    if (lErr) return <div className="p-6 text-red-600">Error líneas: {lErr.message}</div>;

    (lines ?? []).forEach((ln: any) => {
      const pid = Number(ln.id_protagonista);
      const arr = linesByProta.get(pid) ?? [];
      arr.push({
        id: Number(ln.id),
        id_protagonista: pid,
        cantidad: Number(ln.cantidad),
        pago: Boolean(ln.pago),
        created_at: String(ln.created_at),
      });
      linesByProta.set(pid, arr);
    });
  }

  const precio = selectedProducto?.precio ?? null;
  const gInd = selectedProducto?.ganancia_individual ?? null;
  const gGrp = selectedProducto?.ganancia_grupo ?? null;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Ventas · Protagonistas
          </h1>

        </div>

        {/* Picker */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-4">
          <VentasProtagonistasPicker
            ventas={ventasRows.map((v) => ({ id: v.id, nombre_venta: v.nombre_venta }))}
            productos={productosRows.map((p) => ({ id: p.id, nombre_producto: p.nombre_producto }))}
            selectedVentaId={ventaId}
            selectedProductoId={selectedProductoId}
          />

          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            {selectedProducto ? (
              <>
                <div>
                  Precio: <span className="font-semibold">{money(precio)}</span> · Gan. ind:{" "}
                  <span className="font-semibold">{money(gInd)}</span> · Gan. grupo:{" "}
                  <span className="font-semibold">{money(gGrp)}</span>
                </div>
                <div className="mt-1">
                  Cargás compras por protagonista. Cada compra queda como una línea y después podés marcarla como pagada.
                </div>
              </>
            ) : (
              <div>Elegí una venta y un producto para empezar.</div>
            )}
          </div>

          {ventaId && productosRows.length === 0 && (
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
              Esta venta no tiene productos. Cargalos en{" "}
              <Link className="underline" href={`/admin/ventas/${ventaId}/editar`}>
                Editar venta
              </Link>
              .
            </div>
          )}
        </div>

        {/* Buscador de protagonistas */}
        <TableFilters
          ramas={[...RAMAS]}
          initialQ={q}
          initialRama={rama}
          initialActivo="" // no lo usamos (ya filtramos activo=true)
          includeToastParam={false}
          placeholder="Buscar protagonista..."
        />

        {/* Tabla */}
        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Protagonista</th>
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3">Nueva compra</th>
                  <th className="px-4 py-3">Compras cargadas</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {protagonistas.map((p) => {
                  const lines = linesByProta.get(p.id) ?? [];

                  const pagadas = lines.filter((x) => x.pago);
                  const pendientes = lines.filter((x) => !x.pago);

                  const cantPagada = pagadas.reduce((acc, x) => acc + x.cantidad, 0);
                  const cantPendiente = pendientes.reduce((acc, x) => acc + x.cantidad, 0);

                  const totalPagado = precio != null ? cantPagada * precio : null;
                  const totalPend = precio != null ? cantPendiente * precio : null;

                  return (
                    <tr key={p.id} className="text-gray-700 dark:text-gray-300 align-top">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold">
                          {p.apellido}, {p.nombre}
                        </div>

                        {(cantPagada > 0 || cantPendiente > 0) && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div>
                              <span className="font-semibold">Pagado:</span> {cantPagada} ·{" "}
                              <span className="font-semibold">{money(totalPagado)}</span>
                            </div>
                            <div>
                              <span className="font-semibold">Pendiente:</span> {cantPendiente} ·{" "}
                              <span className="font-semibold">{money(totalPend)}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">{p.rama}</td>

                      {/* Agregar compra */}
                      <td className="px-4 py-3">
                        <form action={createVentaProtagonistaLineAction} className="flex items-center gap-3">
                          <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                          <input type="hidden" name="id_venta_detalle" value={selectedProductoId ?? ""} />
                          <input type="hidden" name="id_protagonista" value={p.id} />

                          <input
                            name="cantidad"
                            inputMode="numeric"
                            className="h-9 w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                       px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                            placeholder="Cant."
                            disabled={!selectedProductoId}
                          />

                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" name="pago" className="h-4 w-4" disabled={!selectedProductoId} />
                            Pago
                          </label>

                          <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold text-sm"
                            disabled={!selectedProductoId}
                          >
                            Agregar
                          </button>
                        </form>
                      </td>

                      {/* Compras (detalle) */}
                      <td className="px-4 py-3">
                        {lines.length === 0 ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                        ) : (
                          <div className="space-y-2">
                            {lines.map((ln) => {
                              const lineTotal = precio != null ? ln.cantidad * precio : null;

                              return (
                                <div key={ln.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold">Cantidad: {ln.cantidad}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {formatARDateTime(ln.created_at)} · Total:{" "}
                                        <span className="font-semibold">{money(lineTotal)}</span> ·{" "}
                                        {ln.pago ? "Pagado" : "Pendiente"}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Toggle pago */}
                                      <form action={setVentaProtagonistaPagoAction}>
                                        <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                                        <input type="hidden" name="id_venta_detalle" value={selectedProductoId ?? ""} />
                                        <input type="hidden" name="line_id" value={ln.id} />
                                        <input type="hidden" name="pago" value={ln.pago ? "false" : "true"} />

                                        <button
                                          type="submit"
                                          className={`text-xs px-2 py-1 rounded border ${
                                            ln.pago
                                              ? "bg-white text-gray-700 hover:bg-gray-50"
                                              : "bg-green-50 text-green-700 hover:bg-green-100"
                                          }`}
                                        >
                                          {ln.pago ? "Marcar pendiente" : "Marcar pagado"}
                                        </button>
                                      </form>

                                      {/* Borrar */}
                                      <form action={deleteVentaProtagonistaLineAction}>
                                        <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                                        <input type="hidden" name="id_venta_detalle" value={selectedProductoId ?? ""} />
                                        <input type="hidden" name="line_id" value={ln.id} />
                                        <button
                                          type="submit"
                                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                                        >
                                          Borrar
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {protagonistas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay protagonistas para esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            className="px-4 py-3 text-xs text-gray-500 uppercase border-t
                       dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
          >
            Total protagonistas: {protagonistas.length}
          </div>
        </div>
      </div>
    </main>
  );
}
