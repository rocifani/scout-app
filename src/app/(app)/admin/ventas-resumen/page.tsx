import Link from "next/link";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import InlinePagoAllCheckbox from "@/components/InlinePagoAllCheckbox";
import InlineRetiroAllCheckbox from "@/components/InlineRetiroAllCheckbox";
import { setVentaPagoAllForPersonaAction, setVentaRetiroAllForPersonaAction } from "../ventas-compras/actions";

type VentaCabecera = { id: number; nombre_venta: string | null; created_at: string };

type DetalleRow = {
  id: number;
  nombre_producto: string | null;
  precio: number | null;
  costo: number | null;
};

type CompraRow = {
  id: number;
  id_venta_detalle: number;
  comprador_tipo: "protagonista" | "educador" | "grupo";
  id_protagonista: number | null;
  id_educador: number | null;
  cantidad: number;
  pago: boolean;
  retiro: boolean;
};

type ProtagonistaRow = {
  id: number;
  nombre: string;
  apellido: string;
};

type EducadorRow = {
  id: number;
  nombre: string;
  apellido: string;
};

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function formatARDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR");
}

export default async function VentasResumenPage({
  searchParams,
}: {
  searchParams?: Promise<{ venta?: string; vista?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const ventaId = sp.venta ? Number(sp.venta) : null;
  const vista: "producto" | "protagonista" =
    sp.vista === "protagonista" ? "protagonista" : "producto";

  const supabase = await createSupabaseServerReadOnly();

  const { data: ventas, error: vErr } = await supabase
    .from("ventas_cabecera")
    .select("id, nombre_venta, created_at")
    .order("created_at", { ascending: false });

  if (vErr) return <div className="p-6 text-red-600">Error ventas: {vErr.message}</div>;
  const ventasRows = (ventas ?? []) as VentaCabecera[];

  let detalles: DetalleRow[] = [];

  let resumenProducto: {
    id: number;
    producto: string;
    precio: number | null;
    costo: number | null;
    qtyTotal: number;
    qtyPagada: number;
    qtyPend: number;
    totalBruto: number | null;
    totalCosto: number | null;
  }[] = [];

  let resumenComprador: {
    key: string;
    nombre: string;
    compradorTipo: "protagonista" | "educador" | "grupo";
    idProtagonista: number | null;
    idEducador: number | null;
    cantidadesPorProducto: Record<number, number>;
    totalCantidad: number;
    totalImporte: number;
    allPaid: boolean;
    allRetired: boolean;
  }[] = [];

  let totalVenta = 0;

  if (ventaId) {
    const { data: detallesData, error: detallesErr } = await supabase
      .from("ventas_detalle")
      .select("id, nombre_producto, precio,costo")
      .eq("id_ventas_cabecera", ventaId)
      .order("created_at", { ascending: true });

    if (detallesErr) {
      return <div className="p-6 text-red-600">Error detalle: {detallesErr.message}</div>;
    }

    detalles = (detallesData ?? []) as DetalleRow[];
    const detalleIds = detalles.map((d) => d.id);

    const preciosByDetalle = new Map<number, { nombre: string; precio: number | null }>();
    detalles.forEach((d) => {
      preciosByDetalle.set(d.id, {
        nombre: d.nombre_producto ?? `Producto #${d.id}`,
        precio: d.precio,
      });
    });

    let compras: CompraRow[] = [];
    if (detalleIds.length > 0) {
      const { data: comprasData, error: comprasErr } = await supabase
        .from("ventas_compras")
        .select("id, id_venta_detalle, comprador_tipo, id_protagonista, id_educador, cantidad, pago, retiro")
        .in("id_venta_detalle", detalleIds);

      if (comprasErr) {
        return <div className="p-6 text-red-600">Error compras: {comprasErr.message}</div>;
      }

      compras = (comprasData ?? []) as CompraRow[];
    }

    resumenProducto = detalles.map((d) => {
      const comprasProd = compras.filter((c) => c.id_venta_detalle === d.id);

      const qtyTotal = comprasProd.reduce((acc, x) => acc + Number(x.cantidad ?? 0), 0);
      const qtyPagada = comprasProd
        .filter((x) => x.pago)
        .reduce((acc, x) => acc + Number(x.cantidad ?? 0), 0);
      const qtyPend = qtyTotal - qtyPagada;

      const totalBruto = d.precio != null ? qtyTotal * d.precio : null;

      const totalCosto = d.costo != null ? qtyTotal * d.costo : null;

      return {
        id: d.id,
        producto: d.nombre_producto ?? `Producto #${d.id}`,
        precio: d.precio,
        qtyTotal,
        qtyPagada,
        qtyPend,
        totalBruto,
        costo: d.costo,
        totalCosto,
      };
    });

    totalVenta = resumenProducto.reduce((acc, r) => acc + (r.totalBruto ?? 0), 0);

    const protagonistaIds = Array.from(
      new Set(
        compras
          .filter((c) => c.comprador_tipo === "protagonista" && c.id_protagonista != null)
          .map((c) => Number(c.id_protagonista))
      )
    );

    const educadorIds = Array.from(
      new Set(
        compras
          .filter((c) => c.comprador_tipo === "educador" && c.id_educador != null)
          .map((c) => Number(c.id_educador))
      )
    );

    const protagonistasById = new Map<number, string>();
    const educadoresById = new Map<number, string>();

    if (protagonistaIds.length > 0) {
      const { data: protasData, error: protasErr } = await supabase
        .from("protagonistas")
        .select("id, nombre, apellido")
        .in("id", protagonistaIds);

      if (protasErr) {
        return <div className="p-6 text-red-600">Error protagonistas: {protasErr.message}</div>;
      }

      ((protasData ?? []) as ProtagonistaRow[]).forEach((p) => {
        protagonistasById.set(p.id, `${p.apellido}, ${p.nombre}`);
      });
    }

    if (educadorIds.length > 0) {
      const { data: educadoresData, error: educadoresErr } = await supabase
        .from("educadores")
        .select("id, nombre, apellido")
        .in("id", educadorIds);

      if (educadoresErr) {
        return <div className="p-6 text-red-600">Error educadores: {educadoresErr.message}</div>;
      }

      ((educadoresData ?? []) as EducadorRow[]).forEach((e) => {
        educadoresById.set(e.id, `${e.apellido}, ${e.nombre}`);
      });
    }

    const agg = new Map<
      string,
      {
        nombre: string;
        compradorTipo: "protagonista" | "educador" | "grupo";
        idProtagonista: number | null;
        idEducador: number | null;
        cantidadesPorProducto: Record<number, number>;
        totalCantidad: number;
        totalImporte: number;
        hasAny: boolean;
        allPaid: boolean;
        allRetired: boolean;
      }
    >();

    for (const c of compras) {
      let key = "";
      let nombre = "";
      let compradorTipo: "protagonista" | "educador" | "grupo";
      let idProtagonista: number | null = null;
      let idEducador: number | null = null;

      if (c.comprador_tipo === "protagonista" && c.id_protagonista != null) {
        const pid = Number(c.id_protagonista);
        key = `protagonista-${pid}`;
        nombre = protagonistasById.get(pid) ?? `Protagonista #${pid}`;
        compradorTipo = "protagonista";
        idProtagonista = pid;
      } else if (c.comprador_tipo === "educador" && c.id_educador != null) {
        const eid = Number(c.id_educador);
        key = `educador-${eid}`;
        nombre = educadoresById.get(eid) ?? `Educador #${eid}`;
        compradorTipo = "educador";
        idEducador = eid;
      } else if (c.comprador_tipo === "grupo") {
        key = "grupo";
        nombre = "Grupo";
        compradorTipo = "grupo";
      } else {
        continue;
      }

      const precio = preciosByDetalle.get(c.id_venta_detalle)?.precio ?? 0;
      const cantidad = Number(c.cantidad ?? 0);
      const importe = cantidad * Number(precio ?? 0);

      if (!agg.has(key)) {
        agg.set(key, {
          nombre,
          compradorTipo,
          idProtagonista,
          idEducador,
          cantidadesPorProducto: {},
          totalCantidad: 0,
          totalImporte: 0,
          hasAny: false,
          allPaid: true,
          allRetired: true,
        });
      }

      const row = agg.get(key)!;

      row.cantidadesPorProducto[c.id_venta_detalle] =
        (row.cantidadesPorProducto[c.id_venta_detalle] ?? 0) + cantidad;

      row.totalCantidad += cantidad;
      row.totalImporte += importe;
      row.hasAny = true;
      row.allPaid = row.allPaid && Boolean(c.pago);
      row.allRetired = row.allRetired && Boolean(c.retiro);
    }

    resumenComprador = Array.from(agg.entries())
      .map(([key, row]) => ({
        key,
        nombre: row.nombre,
        compradorTipo: row.compradorTipo,
        idProtagonista: row.idProtagonista,
        idEducador: row.idEducador,
        cantidadesPorProducto: row.cantidadesPorProducto,
        totalCantidad: row.totalCantidad,
        totalImporte: row.totalImporte,
        allPaid: row.hasAny ? row.allPaid : false,
        allRetired: row.hasAny ? row.allRetired : false,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Resumen de ventas
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-4">
          <form className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-96">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Venta
              </label>
              <select
                name="venta"
                defaultValue={ventaId ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="">Seleccionar venta</option>
                {ventasRows.map((v) => {
                  const fecha = v.created_at ? formatARDateShort(v.created_at) : "—";
                  const label = `${v.nombre_venta ?? `Venta #${v.id}`} · ${fecha}`;

                  return (
                    <option key={v.id} value={v.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <input type="hidden" name="vista" value={vista} />

            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold"
            >
              Ver resumen
            </button>

            {ventaId && (
              <Link
                className="h-10 px-4 rounded-lg border font-semibold flex items-center justify-center border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                href={`/admin/ventas-resumen/export-xlsx?venta=${ventaId}&vista=${vista}`}
              >
                Descargar Excel
              </Link>
            )}
          </form>

          {ventaId && (
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/ventas-resumen?venta=${ventaId}&vista=producto`}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                  vista === "producto"
                    ? "bg-[#FCDB52] text-gray-900 border-[#FCDB52]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
                }`}
              >
                Ver por producto
              </Link>

              <Link
                href={`/admin/ventas-resumen?venta=${ventaId}&vista=protagonista`}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                  vista === "protagonista"
                    ? "bg-[#FCDB52] text-gray-900 border-[#FCDB52]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
                }`}
              >
                Ver por comprador
              </Link>
            </div>
          )}
        </div>

        {!ventaId ? (
          <div className="text-gray-600 dark:text-gray-300">
            Elegí una venta para ver el resumen.
          </div>
        ) : vista === "producto" ? (
          <div className="w-full overflow-hidden rounded-lg shadow">
            <div className="w-full overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Cant. total</th>
                    <th className="px-4 py-3">Pagado</th>
                    <th className="px-4 py-3">Pendiente</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Total venta</th>
                    <th className="px-4 py-3">Costo</th>
                    <th className="px-4 py-3">Total costo</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                  {resumenProducto.map((r) => (
                    <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3 font-semibold">{r.producto}</td>
                      <td className="px-4 py-3">{r.qtyTotal}</td>
                      <td className="px-4 py-3">{r.qtyPagada}</td>
                      <td className="px-4 py-3">{r.qtyPend}</td>
                      <td className="px-4 py-3">{money(r.precio)}</td>
                      <td className="px-4 py-3">{money(r.totalBruto)}</td>
                      <td className="px-4 py-3">{money(r.costo)}</td>
                      <td className="px-4 py-3">{money(r.totalCosto)}</td>
                    </tr>
                  ))}

                  {resumenProducto.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400"
                      >
                        Esta venta no tiene productos o no hay compras cargadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 text-xs text-gray-500 uppercase border-t dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
              Total estimado venta: {money(totalVenta)} | Total estimado costo:{" "}
              {money(
                resumenProducto.reduce((acc, r) => acc + (r.totalCosto ?? 0), 0)
              )}
            </div>
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-lg shadow">
            <div className="w-full overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                    <th className="px-4 py-3 sticky left-0 z-10 bg-gray-50 dark:bg-gray-800">Comprador</th>
                    {detalles.map((d) => (
                      <th key={d.id} className="px-4 py-3">
                        {d.nombre_producto ?? `Producto #${d.id}`}
                      </th>
                    ))}
                    <th className="px-4 py-3">Total cant.</th>
                    <th className="px-4 py-3">Total $</th>
                    <th className="px-4 py-3 text-center">Pago total</th>
                    <th className="px-4 py-3 text-center">Retiro total</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                  {resumenComprador.map((r) => (
                    <tr key={r.key} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3 font-semibold sticky left-0 z-10 bg-white dark:bg-gray-800">
                        {r.nombre}
                      </td>

                      {detalles.map((d) => (
                        <td key={d.id} className="px-4 py-3 text-center">
                          {r.cantidadesPorProducto[d.id] ?? 0}
                        </td>
                      ))}

                      <td className="px-4 py-3 font-semibold">{r.totalCantidad}</td>
                      <td className="px-4 py-3 font-semibold">{money(r.totalImporte)}</td>
                      <td className="px-4 py-3 text-center">
                        <InlinePagoAllCheckbox
                          action={setVentaPagoAllForPersonaAction}
                          ventaId={ventaId}
                          compradorTipo={r.compradorTipo}
                          idProtagonista={r.idProtagonista}
                          idEducador={r.idEducador}
                          checked={r.allPaid}
                          returnTo={`/admin/ventas-resumen?venta=${ventaId}&vista=protagonista`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <InlineRetiroAllCheckbox
                          action={setVentaRetiroAllForPersonaAction}
                          ventaId={ventaId}
                          compradorTipo={r.compradorTipo}
                          idProtagonista={r.idProtagonista}
                          idEducador={r.idEducador}
                          checked={r.allRetired}
                          returnTo={`/admin/ventas-resumen?venta=${ventaId}&vista=protagonista`}
                        />
                      </td>
                    </tr>
                  ))}

                  {resumenComprador.length === 0 && (
                    <tr>
                      <td
                        colSpan={1 + detalles.length + 4}
                        className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400"
                      >
                        Esta venta no tiene compras cargadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 text-xs text-gray-500 uppercase border-t dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
              Total estimado venta: {money(totalVenta)}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}