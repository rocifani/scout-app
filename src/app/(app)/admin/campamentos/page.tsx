import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type Campamento = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  costo: number;
};

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default async function CampamentosPage({
  searchParams,
}: {
  searchParams?: Promise<{ toast?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("campamentos")
    .select("id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, lugar, costo")
    .order("fecha_inicio", { ascending: true });

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const rows = (data ?? []) as Campamento[];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Campamentos</h1>
          <Link
            href="/admin/campamentos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            Nuevo <span aria-hidden>+</span>
          </Link>
        </div>

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                               dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                  <th className="px-4 py-3">Lugar</th>
                  <th className="px-4 py-3">Fechas</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map((c) => (
                  <tr key={c.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3 font-semibold">{c.lugar}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatFecha(c.fecha_inicio)} → {formatFecha(c.fecha_fin)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {c.hora_inicio.slice(0, 5)} - {c.hora_fin.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ${c.costo.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Link
                        href={`/admin/campamentos/${c.id}/detalle`}
                        className="px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200
                                    hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                        Ver detalle
                        </Link>
                        <Link
                        href={`/admin/campamentos/${c.id}/editar`}
                        className="px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200
                                    hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                        Editar
                        </Link>
                    </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay campamentos cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 text-xs text-gray-500 uppercase border-t
                         dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
            Total: {rows.length}
          </div>
        </div>
      </div>
    </main>
  );
}