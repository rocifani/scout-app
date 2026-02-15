"use client";

import { useMemo, useState } from "react";

type DetalleDraft = {
  nombre_producto: string;
  precio: string; // strings para inputs
  costo: string;
  ganancia_individual: string;
  ganancia_grupo: string;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
};

function numOrEmpty(v: string) {
  const s = v.trim();
  if (!s) return "";
  const n = Number(s);
  return Number.isFinite(n) ? s : "";
}

export default function VentaCreateForm({ action }: Props) {
  const [detalles, setDetalles] = useState<DetalleDraft[]>([
    { nombre_producto: "", precio: "", costo: "", ganancia_individual: "", ganancia_grupo: "" },
  ]);

  const detallesJson = useMemo(() => {
    // serializamos tal cual; validación fuerte se hace en server
    return JSON.stringify(detalles);
  }, [detalles]);

  function addLinea() {
    setDetalles((prev) => [
      ...prev,
      { nombre_producto: "", precio: "", costo: "", ganancia_individual: "", ganancia_grupo: "" },
    ]);
  }

  function removeLinea(idx: number) {
    setDetalles((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLinea(idx: number, patch: Partial<DetalleDraft>) {
    setDetalles((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  return (
    <form action={action} className="grid gap-5">
      {/* Cabecera */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Nombre de la venta
        </label>
        <input
          name="nombre_venta"
          className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          placeholder="Ej: Rifa 2026"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Fecha inicio
          </label>
          <input
            name="fecha_inicio"
            type="date"
            className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                       px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Fecha fin
          </label>
          <input
            name="fecha_fin"
            type="date"
            className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                       px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          />
        </div>
      </div>

      {/* Detalles */}
      <div className="border-t pt-4 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Productos</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cargá al menos 1 producto para esta venta.
            </p>
          </div>

          <button
            type="button"
            onClick={addLinea}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            Agregar producto <span aria-hidden>+</span>
          </button>
        </div>

        <div className="grid gap-3">
          {detalles.map((d, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Nombre del producto
                    </label>
                    <input
                      value={d.nombre_producto}
                      onChange={(e) => updateLinea(idx, { nombre_producto: e.target.value })}
                      className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      placeholder="Ej: Bono contribución"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Precio
                    </label>
                    <input
                      value={d.precio}
                      onChange={(e) => updateLinea(idx, { precio: numOrEmpty(e.target.value) })}
                      inputMode="decimal"
                      className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      placeholder="Ej: 1500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Costo
                    </label>
                    <input
                      value={d.costo}
                      onChange={(e) => updateLinea(idx, { costo: numOrEmpty(e.target.value) })}
                      inputMode="decimal"
                      className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      placeholder="Ej: 900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Ganancia individual
                    </label>
                    <input
                      value={d.ganancia_individual}
                      onChange={(e) => updateLinea(idx, { ganancia_individual: numOrEmpty(e.target.value) })}
                      inputMode="decimal"
                      className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      placeholder="Ej: 300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Ganancia grupo
                    </label>
                    <input
                      value={d.ganancia_grupo}
                      onChange={(e) => updateLinea(idx, { ganancia_grupo: numOrEmpty(e.target.value) })}
                      inputMode="decimal"
                      className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                      placeholder="Ej: 300"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => removeLinea(idx)}
                    disabled={detalles.length === 1}
                    className="px-3 py-2 text-sm font-semibold rounded-lg
                               border border-red-200 text-red-700 bg-red-50
                               hover:bg-red-100 active:bg-red-200
                               disabled:opacity-50 disabled:cursor-not-allowed
                               dark:border-red-900/40 dark:text-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                    title={detalles.length === 1 ? "Debe haber al menos un producto" : "Eliminar producto"}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* hidden json */}
        <input type="hidden" name="detalles_json" value={detallesJson} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                     bg-[#FCDB52] text-gray-900
                     hover:bg-[#F3D146] active:bg-[#E9C83D]
                     focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
        >
          Crear venta
        </button>

        <a
          href="/admin/ventas"
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700
                     text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
