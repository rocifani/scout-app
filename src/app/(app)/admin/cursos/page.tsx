import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type Curso = {
  id: number;
  created_at: string;
  nombre_curso: string;
  sistema_actual: boolean;
};

function EstadoPill({ activo }: { activo: boolean }) {
  const base = "px-2 py-1 font-semibold leading-tight rounded-full text-xs";
  return activo ? (
    <span className={`${base} text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100`}>
      Activo
    </span>
  ) : (
    <span className={`${base} text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-100`}>
      Inactivo
    </span>
  );
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams?: Promise<{ toast?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("cursos")
    .select("id, created_at, nombre_curso, sistema_actual")
    .order("sistema_actual", { ascending: false })
    .order("nombre_curso", { ascending: true });

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const rows = (data ?? []) as Curso[];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Cursos</h1>

          <Link
            href="/admin/cursos/nuevo"
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
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map((c) => (
                  <tr key={c.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.nombre_curso}</div>
                    </td>

                    <td className="px-4 py-3">
                      <EstadoPill activo={!!c.sistema_actual} />
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/cursos/${c.id}/editar`}
                        className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200
                                   hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay cursos.
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
