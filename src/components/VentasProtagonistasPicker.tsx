"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Venta = { id: number; nombre_venta: string | null };
type Producto = { id: number; nombre_producto: string | null };

export default function VentasProtagonistasPicker({
  ventas,
  productos,
  selectedVentaId,
  selectedProductoId,
}: {
  ventas: Venta[];
  productos: Producto[];
  selectedVentaId: number | null;
  selectedProductoId: number | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const base = "/admin/ventas-protagonistas";

  function push(venta: number | null, producto: number | null) {
    const params = new URLSearchParams();

    // Limpio toast al navegar con selects para que no quede pegado
    if (venta) params.set("venta", String(venta));
    if (producto) params.set("producto", String(producto));

    router.push(`${base}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Venta
        </label>
        <select
          value={selectedVentaId ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            // al cambiar venta, reseteamos producto
            push(v, null);
          }}
          className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
        >
          <option value="">Seleccionar venta</option>
          {ventas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre_venta ?? `Venta #${v.id}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Producto
        </label>
        <select
          value={selectedProductoId ?? ""}
          onChange={(e) => {
            const p = e.target.value ? Number(e.target.value) : null;
            push(selectedVentaId, p);
          }}
          disabled={!selectedVentaId || productos.length === 0}
          className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40
                     disabled:opacity-60"
        >
          {(!selectedVentaId || productos.length === 0) && <option value="">—</option>}
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre_producto ?? `Producto #${p.id}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
