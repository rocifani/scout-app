// ✅ Archivo: src/components/VentasProtagonistasPicker.tsx
"use client";

import { useRouter } from "next/navigation";

type Venta = { id: number; nombre_venta: string | null };
type Producto = { id: number; nombre_producto: string | null };

// producto puede ser:
// - "all" (Todos los productos)
// - "<id>" (string numérica)
// - "" (nada)
type ProductoKey = "all" | string | null;

export default function VentasProtagonistasPicker({
  ventas,
  productos,
  selectedVentaId,
  selectedProductoKey,
}: {
  ventas: Venta[];
  productos: Producto[];
  selectedVentaId: number | null;
  selectedProductoKey: ProductoKey; // ✅ ahora soporta "all"
}) {
  const router = useRouter();
  const base = "/admin/ventas-compras";

  function push(venta: number | null, producto: ProductoKey) {
    const params = new URLSearchParams();
    if (venta) params.set("venta", String(venta));
    if (producto) params.set("producto", producto); // "all" o id string
    router.push(`${base}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Venta</label>
        <select
          value={selectedVentaId ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            // ✅ al cambiar venta, vamos a "Todos los productos"
            push(v, v ? "all" : null);
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
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Producto</label>
        <select
          value={selectedProductoKey ?? ""}
          onChange={(e) => {
            const val = e.target.value || null; // "all" | "123" | null
            push(selectedVentaId, val);
          }}
          disabled={!selectedVentaId || productos.length === 0}
          className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40
                     disabled:opacity-60"
        >
          {(!selectedVentaId || productos.length === 0) && <option value="">—</option>}

          {/* ✅ Nuevo */}
          {selectedVentaId && productos.length > 0 && <option value="all">Todos los productos</option>}

          {productos.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.nombre_producto ?? `Producto #${p.id}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
