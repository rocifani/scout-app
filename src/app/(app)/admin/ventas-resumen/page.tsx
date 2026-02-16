import Link from "next/link";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";

type VentaCabecera = { id: number; nombre_venta: string | null };

type DetalleRow = {
  id: number;
  nombre_producto: string | null;
  precio: number | null;
  ventas_compras?: { cantidad: number; pago: boolean }[];
};

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

export default async function VentasResumenPage({
  searchParams,
}: {
  searchParams?: Promise<{ venta?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const ventaId = sp.venta ? Number(sp.venta) : null;

  const supabase = await createSupabaseServerReadOnly();

  // 1) Ventas para selector
  const { data: ventas, error: vErr } = await supabase
    .from("ventas_cabecera")
    .select("id, nombre_venta")
    .order("created_at", { ascending: false });

  if (vErr) return <div className="p-6 text-red-600">Error ventas: {vErr.message}</div>;
  const ventasRows = (ventas ?? []) as VentaCabecera[];

  // 2) Detalles + compras (nested) para la venta elegida
  let detalles: DetalleRow[] = [];
  if (ventaId) {
    const { data, error } = await supabase
      .from("ventas_detalle")
      .select("id, nombre_producto, precio, ventas_compras(cantidad, pago)")
      .eq("id_ventas_cabecera", ventaId)
      .order("created_at", { ascending: true });

    if (error) return <div className="p-6 text-red-600">Error detalle: {error.message}</div>;
    detalles = (data ?? []) as any;
  }

  // 3) Agregación
  const resumen = detalles.map((d) => {
    const compras = d.ventas_compras ?? [];
    const qtyTotal = compras.reduce((acc, x) => acc + Number(x.cantidad ?? 0), 0);
    const qtyPagada = compras.filter((x) => x.pago).reduce((acc, x) => acc + Number(x.cantidad ?? 0), 0);
    const qtyPend = qtyTotal - qtyPagada;

    const totalBruto = d.precio != null ? qtyTotal * d.precio : null;
    return {
      id: d.id,
      producto: d.nombre_producto ?? `Producto #${d.id}`,
      precio: d.precio,
      qtyTotal,
      qtyPagada,
      qtyPend,
      totalBruto,
    };
  });

  const totalVenta = resumen.reduce((acc, r) => acc + (r.totalBruto ?? 0), 0);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Resumen de ventas (para proveedor)
          </h1>
        </div>

        {/* Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-4">
          <form className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-96">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Venta</label>
              <select
                name="venta"
                defaultValue={ventaId ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="">Seleccionar venta</option>
                {ventasRows.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre_venta ?? `Venta #${v.id}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold"
            >
              Ver resumen
            </button>

            {ventaId && (
              <Link
                className="h-10 px-4 rounded-lg border font-semibold flex items-center justify-center
                            border-gray-300 text-gray-700 bg-white hover:bg-gray-50
                            dark:border-gray-600 dark:text-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                href={`/admin/ventas-resumen/export-xlsx?venta=${ventaId}`}
                >
                Descargar Excel
                </Link>
            )}
          </form>

          
        </div>

        {!ventaId ? (
          <div className="text-gray-600 dark:text-gray-300">Elegí una venta para ver el resumen.</div>
        ) : (
          <div className="w-full overflow-hidden rounded-lg shadow">
            <div className="w-full overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr
                    className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                               dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                  >
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Cant. total</th>
                    <th className="px-4 py-3">Pagado</th>
                    <th className="px-4 py-3">Pendiente</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                  {resumen.map((r) => (
                    <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3 font-semibold">{r.producto}</td>
                      <td className="px-4 py-3">{r.qtyTotal}</td>
                      <td className="px-4 py-3">{r.qtyPagada}</td>
                      <td className="px-4 py-3">{r.qtyPend}</td>
                      <td className="px-4 py-3">{money(r.precio)}</td>
                      <td className="px-4 py-3">{money(r.totalBruto)}</td>
                    </tr>
                  ))}

                  {resumen.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                        Esta venta no tiene productos o no hay compras cargadas.
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
              Total estimado venta: {money(totalVenta)}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
