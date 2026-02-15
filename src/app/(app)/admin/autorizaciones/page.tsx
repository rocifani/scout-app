import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type Autorizacion = {
  id: number;
  created_at: string;
  nombre_autorizacion: string;
  activo: boolean;
};

function EstadoPill({ activo }: { activo: boolean }) {
  const base = "px-2 py-1 font-semibold leading-tight rounded-full text-xs";
  return activo ? (
    <span className={`${base} text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100`}>
      Activo
    </span>
  ) : (
    <span className={`${base} text-gray-700 bg-gray-100 dark:text-gray-100 dark:bg-gray-700`}>
      Inactivo
    </span>
  );
}

export default async function AutorizacionesPage({
  searchParams,
}: {
  searchParams?: Promise<{ toast?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("autorizaciones")
    .select("id, created_at, nombre_autorizacion, activo")
    .order("nombre_autorizacion", { ascending: true });

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const rows = (data ?? []) as Autorizacion[];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Autorizaciones</h1>

          <Link
            href="/admin/autorizaciones/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            Nueva <span aria-hidden>+</span>
          </Link>
        </div>

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map((a) => (
                  <tr key={a.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/autorizaciones/${a.id}/editar`}
                        className="font-semibold hover:underline focus:outline-none focus:underline"
                      >
                        {a.nombre_autorizacion}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <EstadoPill activo={a.activo} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Link
                          href={`/admin/autorizaciones/${a.id}/editar`}
                          className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200
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
                    <td colSpan={3} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay autorizaciones cargadas.
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
