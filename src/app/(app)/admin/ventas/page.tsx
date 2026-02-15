import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type VentaCabecera = {
  id: number;
  created_at: string;
  fecha_inicio: string | null; // YYYY-MM-DD
  fecha_fin: string | null;    // YYYY-MM-DD
  nombre_venta: string | null;
};

function isVigenteHoy(v: VentaCabecera) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const t = `${y}-${m}-${d}`;

  // Vigente si: (sin inicio o inicio <= hoy) y (sin fin o fin >= hoy)
  const okInicio = !v.fecha_inicio || v.fecha_inicio <= t;
  const okFin = !v.fecha_fin || v.fecha_fin >= t;
  return okInicio && okFin;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams?: Promise<{
    toast?: string;
    q?: string;
    vigente?: string; // "", "true", "false"
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;
  const q = (sp.q ?? "").trim();
  const vigente = (sp.vigente ?? "").trim(); // "", "true", "false"

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("ventas_cabecera")
    .select("id, created_at, fecha_inicio, fecha_fin, nombre_venta");

  if (q) {
    const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.ilike("nombre_venta", `%${safe}%`);
  }

  // Traemos y filtramos "vigente" en server (simple y seguro)
  const { data, error } = await query
    .order("created_at", { ascending: false });

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  let rows = (data ?? []) as VentaCabecera[];

  if (vigente === "true") rows = rows.filter(isVigenteHoy);
  if (vigente === "false") rows = rows.filter((v) => !isVigenteHoy(v));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Ventas</h1>

          <div className="flex items-center gap-2">
           

            <Link
              href="/admin/ventas/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                         bg-[#FCDB52] text-gray-900
                         hover:bg-[#F3D146] active:bg-[#E9C83D]
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            >
              Nueva <span aria-hidden>+</span>
            </Link>
          </div>
        </div>


        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Venta</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Fin</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map((v) => {
                  const vigenteHoy = isVigenteHoy(v);

                  return (
                    <tr key={v.id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/ventas/${v.id}/editar`}
                          className="font-semibold hover:underline focus:outline-none focus:underline"
                        >
                          {v.nombre_venta?.trim() ? v.nombre_venta : `Venta #${v.id}`}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-sm">{v.fecha_inicio ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">{v.fecha_fin ?? "—"}</td>

                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            vigenteHoy
                              ? "text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100"
                              : "text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                          }`}
                        >
                          {vigenteHoy ? "Vigente" : "No vigente"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Link
                            href={`/admin/ventas/${v.id}/editar`}
                            className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200
                                       hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay ventas registradas.
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
            Total: {rows.length}
          </div>
        </div>
      </div>
    </main>
  );
}
