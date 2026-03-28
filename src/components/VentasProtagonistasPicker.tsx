"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  ventas: { id: number; nombre_venta: string | null }[];
  productos: { id: number; nombre_producto: string | null }[];
  selectedVentaId: number | null;
  selectedProductoKey: "all" | string | null;
};

export default function VentasProtagonistasPicker({
  ventas,
  productos,
  selectedVentaId,
  selectedProductoKey,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigateWith(next: { venta?: string; producto?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.venta !== undefined) {
      if (next.venta) params.set("venta", next.venta);
      else params.delete("venta");
    }

    if (next.producto !== undefined) {
      if (next.producto) params.set("producto", next.producto);
      else params.delete("producto");
    }

    params.delete("toast");

    const qs = params.toString();
    const href = qs ? `/admin/ventas-compras?${qs}` : "/admin/ventas-compras";

    router.push(href, { scroll: false });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Venta</label>
        <select
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
          value={selectedVentaId ?? ""}
          onChange={(e) => {
            const venta = e.target.value;
            navigateWith({
              venta,
              producto: venta ? "all" : "",
            });
          }}
        >
          <option value="">Seleccionar...</option>
          {ventas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre_venta ?? `Venta #${v.id}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Producto</label>
        <select
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
          value={selectedProductoKey ?? ""}
          disabled={!selectedVentaId}
          onChange={(e) => {
            navigateWith({
              venta: selectedVentaId ? String(selectedVentaId) : "",
              producto: e.target.value,
            });
          }}
        >
          <option value="">Seleccionar...</option>
          <option value="all">Todos los productos</option>
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