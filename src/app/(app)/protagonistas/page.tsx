import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import ProtagonistasFilters from "@/components/ProtagonistasFilters";

type Protagonista = {
  id: number;
  created_at: string;
  nombre: string;
  apellido: string;
  rama: string;
  fecha_nacimiento: string; // "YYYY-MM-DD"
  activo: boolean;
  domicilio: string;
  dni: number;
};

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rovers"] as const;

function formatARDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("es-AR");
}

function EstadoPill({ activo }: { activo: boolean }) {
  const base = "px-2 py-1 font-semibold leading-tight rounded-full";
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

export default async function ProtagonistasPage({
  searchParams,
}: {
  searchParams?: Promise<{
    toast?: string;
    q?: string;
    rama?: string;
    activo?: string; // "true" | "false" | "" (o undefined)
  }>;
}) {
  const sp = (await searchParams) ?? {};

  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;
  const q = (sp.q ?? "").trim();
  const rama = (sp.rama ?? "").trim();
  const activo = (sp.activo ?? "").trim(); // "", "true", "false"

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("protagonistas")
    .select("id, created_at, nombre, apellido, rama, fecha_nacimiento, activo, domicilio, dni");

  // 🔎 búsqueda por nombre o apellido (case-insensitive)
  if (q) {
    const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`);
  }

  // 🏕 filtro por rama
  if (rama) {
    query = query.eq("rama", rama);
  }

  // ✅ filtro por activo (no default)
  if (activo === "true") query = query.eq("activo", true);
  if (activo === "false") query = query.eq("activo", false);

  const { data, error } = await query
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const rows = (data ?? []) as Protagonista[];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Protagonistas</h1>

          <Link
            href="/protagonistas/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            Nuevo <span aria-hidden>+</span>
          </Link>
        </div>

        {/* ✅ Filtros con auto-búsqueda */}
        <ProtagonistasFilters
          ramas={[...RAMAS]}
          initialQ={q}
          initialRama={rama}
          initialActivo={activo}
        />

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3 hidden md:table-cell">DNI</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Dirección</th>
                  <th className="px-4 py-3 hidden md:table-cell">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map((p) => (
                  <tr key={p.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <Link
                          href={`/protagonistas/${p.id}/editar`}
                          className="font-semibold hover:underline focus:outline-none focus:underline"
                        >
                          {p.apellido}, {p.nombre}
                        </Link>

                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Fecha nacimiento: {formatARDate(p.fecha_nacimiento)}
                        </p>

                        <div className="mt-2 md:hidden">
                          <EstadoPill activo={p.activo} />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm">{p.rama}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{p.dni}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{p.domicilio}</td>

                    <td className="px-4 py-3 text-xs hidden md:table-cell">
                      <EstadoPill activo={p.activo} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Link
                          href={`/protagonistas/${p.id}/editar`}
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
                    <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay protagonistas para esos filtros.
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
