// ✅ Archivo: src/app/(app)/admin/ventas-compras/page.tsx
import Link from "next/link";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import VentasProtagonistasPicker from "@/components/VentasProtagonistasPicker";
import TableFilters from "@/components/TableFilters";
import {
  createVentaCompraLineAction,
  deleteVentaCompraLineAction,
  setVentaCompraPagoAction,
  setVentaPagoAllForPersonaAction,
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

type Linea = {
  id: number;
  id_venta_detalle: number; // ✅ necesario para modo "all"
  comprador_tipo: "protagonista" | "educador" | "grupo";
  id_protagonista: number | null;
  id_educador: number | null;
  cantidad: number;
  pago: boolean;
  created_at: string;
};

type PersonaRow =
  | { kind: "grupo"; key: "g:0"; label: string; ramaLabel: string }
  | { kind: "educador"; key: string; id_educador: number; label: string; ramaLabel: string }
  | { kind: "protagonista"; key: string; id_protagonista: number; label: string; ramaLabel: string };

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function formatARDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR");
}

function toIntOrNull(s: string | null) {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams?: Promise<{
    toast?: string;
    venta?: string;
    producto?: string; // "all" | "<id>"
    q?: string;
    rama?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;

  const ventaId = sp.venta ? Number(sp.venta) : null;

  const productoParam = (sp.producto ?? "").trim(); // "" | "all" | "123"
  const mode: "all" | "one" = productoParam === "all" ? "all" : "one";
  const productoId = mode === "one" ? toIntOrNull(productoParam || null) : null;

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

  // 2) Productos
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

  // ✅ default: si hay venta y no vino producto => "all"
  const selectedProductoKey: "all" | string | null = (() => {
    if (!ventaId) return null;
    if (!productoParam) return "all";
    return productoParam === "all" ? "all" : productoParam; // id string
  })();

  // en modo "one", si no hay id válido, usamos el primero (si existe)
  const selectedProductoId =
    mode === "one" ? (productoId ?? (productosRows[0]?.id ?? null)) : null;

  const selectedProducto =
    selectedProductoId ? productosRows.find((p) => p.id === selectedProductoId) ?? null : null;

  // Map precios/nombres por producto (para modo all)
  const prodInfoById = new Map<number, { nombre: string; precio: number | null }>();
  productosRows.forEach((p) => {
    prodInfoById.set(p.id, {
      nombre: p.nombre_producto ?? `Producto #${p.id}`,
      precio: p.precio ?? null,
    });
  });

  // 3) Personas (Grupo + Educadores + Protagonistas) con filtros
  const personas: PersonaRow[] = [];
  personas.push({ kind: "grupo", key: "g:0", label: "Grupo Scout (interno)", ramaLabel: "—" });

  // Educadores activos
  {
    let qy = supabase.from("educadores").select("id, nombre, apellido, rama, activo").eq("activo", true);

    if (q) {
      const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      qy = qy.or(`nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`);
    }
    if (rama) qy = qy.eq("rama", rama);

    const { data, error } = await qy.order("apellido", { ascending: true }).order("nombre", { ascending: true });
    if (error) return <div className="p-6 text-red-600">Error educadores: {error.message}</div>;

    (data ?? []).forEach((e: any) => {
      const id = Number(e.id);
      personas.push({
        kind: "educador",
        key: `e:${id}`,
        id_educador: id,
        label: `${e.apellido}, ${e.nombre}`,
        ramaLabel: String(e.rama ?? "—"),
      });
    });
  }

  // Protagonistas activos
  {
    let qy = supabase.from("protagonistas").select("id, nombre, apellido, rama, activo").eq("activo", true);

    if (q) {
      const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      qy = qy.or(`nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`);
    }
    if (rama) qy = qy.eq("rama", rama);

    const { data, error } = await qy.order("apellido", { ascending: true }).order("nombre", { ascending: true });
    if (error) return <div className="p-6 text-red-600">Error protagonistas: {error.message}</div>;

    (data ?? []).forEach((p: any) => {
      const id = Number(p.id);
      personas.push({
        kind: "protagonista",
        key: `p:${id}`,
        id_protagonista: id,
        label: `${p.apellido}, ${p.nombre}`,
        ramaLabel: String(p.rama ?? "—"),
      });
    });
  }

  const grupo = personas.filter((x) => x.kind === "grupo");
  const resto = personas.filter((x) => x.kind !== "grupo");
  resto.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  const personasOrdenadas = [...grupo, ...resto];

  // 4) Líneas: modo producto => filtra por producto; modo all => trae todo de la venta
  const linesByKey = new Map<string, Linea[]>();

  if (ventaId && productosRows.length > 0) {
    if (mode === "one" && selectedProductoId) {
      const { data: lines, error: lErr } = await supabase
        .from("ventas_compras")
        .select("id, id_venta_detalle, comprador_tipo, id_protagonista, id_educador, cantidad, pago, created_at")
        .eq("id_venta_detalle", selectedProductoId)
        .order("created_at", { ascending: false });

      if (lErr) return <div className="p-6 text-red-600">Error líneas: {lErr.message}</div>;

      (lines ?? []).forEach((ln: any) => {
        const tipo = String(ln.comprador_tipo) as Linea["comprador_tipo"];
        const idProta = ln.id_protagonista ? Number(ln.id_protagonista) : null;
        const idEdu = ln.id_educador ? Number(ln.id_educador) : null;

        const key = tipo === "grupo" ? "g:0" : tipo === "educador" ? `e:${idEdu}` : `p:${idProta}`;
        const arr = linesByKey.get(key) ?? [];
        arr.push({
          id: Number(ln.id),
          id_venta_detalle: Number(ln.id_venta_detalle),
          comprador_tipo: tipo,
          id_protagonista: idProta,
          id_educador: idEdu,
          cantidad: Number(ln.cantidad),
          pago: Boolean(ln.pago),
          created_at: String(ln.created_at),
        });
        linesByKey.set(key, arr);
      });
    }

    if (mode === "all") {
      const ids = productosRows.map((p) => p.id);

      const { data: lines, error: lErr } = await supabase
        .from("ventas_compras")
        .select("id, id_venta_detalle, comprador_tipo, id_protagonista, id_educador, cantidad, pago, created_at")
        .in("id_venta_detalle", ids)
        .order("created_at", { ascending: false });

      if (lErr) return <div className="p-6 text-red-600">Error líneas: {lErr.message}</div>;

      (lines ?? []).forEach((ln: any) => {
        const tipo = String(ln.comprador_tipo) as Linea["comprador_tipo"];
        const idProta = ln.id_protagonista ? Number(ln.id_protagonista) : null;
        const idEdu = ln.id_educador ? Number(ln.id_educador) : null;

        const key = tipo === "grupo" ? "g:0" : tipo === "educador" ? `e:${idEdu}` : `p:${idProta}`;
        const arr = linesByKey.get(key) ?? [];
        arr.push({
          id: Number(ln.id),
          id_venta_detalle: Number(ln.id_venta_detalle),
          comprador_tipo: tipo,
          id_protagonista: idProta,
          id_educador: idEdu,
          cantidad: Number(ln.cantidad),
          pago: Boolean(ln.pago),
          created_at: String(ln.created_at),
        });
        linesByKey.set(key, arr);
      });
    }
  }

  const precioSel = selectedProducto?.precio ?? null;
  const gInd = selectedProducto?.ganancia_individual ?? null;
  const gGrp = selectedProducto?.ganancia_grupo ?? null;

  const canBulk = Boolean(ventaId);
  const canLoad = Boolean(ventaId && mode === "one" && selectedProductoId);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">{toast}</div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Ventas</h1>
        </div>

        {/* Picker */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-4">
          <VentasProtagonistasPicker
            ventas={ventasRows.map((v) => ({ id: v.id, nombre_venta: v.nombre_venta }))}
            productos={productosRows.map((p) => ({ id: p.id, nombre_producto: p.nombre_producto }))}
            selectedVentaId={ventaId}
            selectedProductoKey={selectedProductoKey}
          />

          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            {!ventaId ? (
              <div>Elegí una venta para empezar.</div>
            ) : productosRows.length === 0 ? (
              <div>Esta venta no tiene productos.</div>
            ) : mode === "all" ? (
              <>
                <div className="font-semibold">Viendo: Todos los productos</div>
                <div className="mt-1">
                  En este modo podés <b>marcar toda la venta como pagada/pendiente</b> por persona y ver todos los productos comprados.
                  Para cargar ventas nuevas, elegí un producto.
                </div>
              </>
            ) : selectedProducto ? (
              <>
                <div>
                  Precio: <span className="font-semibold">{money(precioSel)}</span> · Gan. ind:{" "}
                  <span className="font-semibold">{money(gInd)}</span> · Gan. grupo:{" "}
                  <span className="font-semibold">{money(gGrp)}</span>
                </div>
                <div className="mt-1">En este momento podés cargar ventas por persona o internas del grupo.</div>
              </>
            ) : (
              <div>Elegí un producto.</div>
            )}
          </div>

          {ventaId && productosRows.length === 0 && (
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
              Cargalos en{" "}
              <Link className="underline" href={`/admin/ventas/${ventaId}/editar`}>
                Editar venta
              </Link>
              .
            </div>
          )}
        </div>

        {/* Filtros */}
        <TableFilters
          ramas={[...RAMAS]}
          initialQ={q}
          initialRama={rama}
          initialActivo=""
          includeToastParam={false}
          placeholder="Buscar protagonista o educador..."
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
                  <th className="px-4 py-3">Persona</th>
                  <th className="px-4 py-3">Nueva compra</th>
                  <th className="px-4 py-3">Compras cargadas</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {personasOrdenadas.map((row) => {
                  const lines = linesByKey.get(row.key) ?? [];

                  const pagadas = lines.filter((x) => x.pago);
                  const pendientes = lines.filter((x) => !x.pago);

                  const cantPagada = pagadas.reduce((acc, x) => acc + x.cantidad, 0);
                  const cantPendiente = pendientes.reduce((acc, x) => acc + x.cantidad, 0);

                  const totalPagado =
                    mode === "one"
                      ? precioSel != null
                        ? cantPagada * precioSel
                        : null
                      : pagadas.reduce((acc, ln) => {
                          const pr = prodInfoById.get(ln.id_venta_detalle)?.precio ?? null;
                          return pr == null ? acc : acc + ln.cantidad * pr;
                        }, 0);

                  const totalPend =
                    mode === "one"
                      ? precioSel != null
                        ? cantPendiente * precioSel
                        : null
                      : pendientes.reduce((acc, ln) => {
                          const pr = prodInfoById.get(ln.id_venta_detalle)?.precio ?? null;
                          return pr == null ? acc : acc + ln.cantidad * pr;
                        }, 0);

                  return (
                    <tr key={row.key} className="text-gray-700 dark:text-gray-300 align-top">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold">{row.label}</div>

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

                        {/* ✅ Bulk por venta/persona (siempre disponible con venta elegida) */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={setVentaPagoAllForPersonaAction}>
                            <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                            <input type="hidden" name="producto" value={selectedProductoKey ?? ""} />
                            <input type="hidden" name="comprador_tipo" value={row.kind} />
                            {row.kind === "protagonista" && (
                              <input type="hidden" name="id_protagonista" value={row.id_protagonista} />
                            )}
                            {row.kind === "educador" && (
                              <input type="hidden" name="id_educador" value={row.id_educador} />
                            )}
                            <input type="hidden" name="pago" value="true" />
                            <button
                              type="submit"
                              className="text-xs px-2 py-1 rounded border bg-green-50 text-green-700 hover:bg-green-100"
                              disabled={!canBulk}
                              title="Marca como pagadas todas las compras de esta venta para esta persona (todos los productos)"
                            >
                              Marcar TODO pagado
                            </button>
                          </form>

                          <form action={setVentaPagoAllForPersonaAction}>
                            <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                            <input type="hidden" name="producto" value={selectedProductoKey ?? ""} />
                            <input type="hidden" name="comprador_tipo" value={row.kind} />
                            {row.kind === "protagonista" && (
                              <input type="hidden" name="id_protagonista" value={row.id_protagonista} />
                            )}
                            {row.kind === "educador" && (
                              <input type="hidden" name="id_educador" value={row.id_educador} />
                            )}
                            <input type="hidden" name="pago" value="false" />
                            <button
                              type="submit"
                              className="text-xs px-2 py-1 rounded border bg-white text-gray-700 hover:bg-gray-50"
                              disabled={!canBulk}
                              title="Marca como pendientes todas las compras de esta venta para esta persona (todos los productos)"
                            >
                              Marcar TODO pendiente
                            </button>
                          </form>
                        </div>
                      </td>


                      {/* Agregar compra: SOLO si hay producto seleccionado */}
                      <td className="px-4 py-3">
                        <form action={createVentaCompraLineAction} className="flex items-center gap-3">
                          <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                          <input type="hidden" name="producto" value={selectedProductoKey ?? ""} />
                          <input type="hidden" name="id_venta_detalle" value={selectedProductoId ?? ""} />
                          <input type="hidden" name="comprador_tipo" value={row.kind} />

                          {row.kind === "protagonista" && (
                            <input type="hidden" name="id_protagonista" value={row.id_protagonista} />
                          )}
                          {row.kind === "educador" && (
                            <input type="hidden" name="id_educador" value={row.id_educador} />
                          )}

                          <input
                            name="cantidad"
                            inputMode="numeric"
                            className="h-9 w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                       px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40
                                       disabled:opacity-60"
                            placeholder="Cant."
                            disabled={!canLoad}
                            title={!canLoad ? "Elegí un producto para cargar compras" : undefined}
                          />

                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="pago"
                              className="h-4 w-4"
                              disabled={!canLoad}
                              title={!canLoad ? "Elegí un producto para cargar compras" : undefined}
                            />
                            Pago
                          </label>

                          <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold text-sm disabled:opacity-60"
                            disabled={!canLoad}
                            title={!canLoad ? "Elegí un producto para cargar compras" : undefined}
                          >
                            Agregar
                          </button>
                        </form>
                      </td>

                      {/* Compras */}
                      <td className="px-4 py-3">
                        {lines.length === 0 ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                        ) : (
                          <div className="space-y-2">
                            {lines.map((ln) => {
                              const info = prodInfoById.get(ln.id_venta_detalle);
                              const precioLinea = mode === "one" ? precioSel : info?.precio ?? null;
                              const nombreLinea = mode === "one" ? null : info?.nombre ?? `Producto #${ln.id_venta_detalle}`;

                              const lineTotal = precioLinea != null ? ln.cantidad * precioLinea : null;

                              return (
                                <div key={ln.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      {mode === "all" && (
                                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                          {nombreLinea}
                                        </div>
                                      )}
                                      <div className="text-sm font-semibold">Cantidad: {ln.cantidad}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {formatARDateTime(ln.created_at)} · Total:{" "}
                                        <span className="font-semibold">{money(lineTotal)}</span> ·{" "}
                                        {ln.pago ? "Pagado" : "Pendiente"}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <form action={setVentaCompraPagoAction}>
                                        <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                                        <input type="hidden" name="producto" value={selectedProductoKey ?? ""} />
                                        {/* En modo all, este id_venta_detalle es el del producto de la línea */}
                                        <input type="hidden" name="id_venta_detalle" value={ln.id_venta_detalle} />
                                        <input type="hidden" name="comprador_tipo" value={row.kind} />
                                        <input type="hidden" name="line_id" value={ln.id} />
                                        <input type="hidden" name="pago" value={ln.pago ? "false" : "true"} />

                                        <button
                                          type="submit"
                                          className={`text-xs px-2 py-1 rounded border ${
                                            ln.pago
                                              ? "bg-white text-gray-700 hover:bg-gray-50"
                                              : "bg-green-50 text-green-700 hover:bg-green-100"
                                          }`}
                                          disabled={!ventaId}
                                        >
                                          {ln.pago ? "Marcar pendiente" : "Marcar pagado"}
                                        </button>
                                      </form>

                                      <form action={deleteVentaCompraLineAction}>
                                        <input type="hidden" name="venta_id" value={ventaId ?? ""} />
                                        <input type="hidden" name="producto" value={selectedProductoKey ?? ""} />
                                        <input type="hidden" name="id_venta_detalle" value={ln.id_venta_detalle} />
                                        <input type="hidden" name="comprador_tipo" value={row.kind} />
                                        <input type="hidden" name="line_id" value={ln.id} />

                                        <button
                                          type="submit"
                                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                                          disabled={!ventaId}
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

                {personas.length === 1 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay personas para esos filtros.
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
            Total filas: {personas.length}
          </div>
        </div>
      </div>
    </main>
  );
}
