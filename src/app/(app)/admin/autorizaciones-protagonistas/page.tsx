import { createSupabaseServer } from "@/lib/supabase/server";
import TableFilters from "@/components/TableFilters";
import AutorizacionCellConfirm from "@/components/AutorizacionCellConfirm";
import {
  marcarAutorizacionEntregadaAction,
  marcarAutorizacionNoEntregadaAction,
} from "./actions";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;

type ProtaRow = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  activo: boolean;
};

type AutorizacionRow = {
  id: number;
  nombre_autorizacion: string;
  activo: boolean;
};

type AutProtaRow = {
  id: number;
  id_protagonista: number;
  id_autorizacion: number;
  anio_vigencia: number;
  entregada: boolean | null;
};

function pillClass(active: boolean) {
  return active
    ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
    : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
}

export default async function AdminAutorizacionesProtagonistasPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; rama?: string; activo?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const rama = (sp.rama ?? "").trim();
  const activo = (sp.activo ?? "").trim(); // "", "true", "false"

  const supabase = await createSupabaseServer();
  const anio = new Date().getFullYear();

  // 1) Traer autorizaciones (columnas)
  const { data: autorizaciones, error: autErr } = await supabase
    .from("autorizaciones")
    .select("id,nombre_autorizacion,activo")
    .eq("activo", true)
    .order("nombre_autorizacion", { ascending: true });

  // 2) Traer protagonistas (filas) con filtros
  let protasQuery = supabase
    .from("protagonistas")
    .select("id,nombre,apellido,rama,activo")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (q) {
    const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    protasQuery = protasQuery.or(`nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`);
  }
  if (rama) protasQuery = protasQuery.eq("rama", rama);
  if (activo === "true") protasQuery = protasQuery.eq("activo", true);
  if (activo === "false") protasQuery = protasQuery.eq("activo", false);

  const { data: protas, error: protasErr } = await protasQuery;

  const auts = (autorizaciones ?? []) as AutorizacionRow[];
  const protasTyped = (protas ?? []) as ProtaRow[];

  // 3) Traer entregas del año (solo para los protas que estamos viendo)
  const protaIds = protasTyped.map((p) => p.id);
  const autIds = auts.map((a) => a.id);

  let autProta: AutProtaRow[] = [];
  if (protaIds.length > 0 && autIds.length > 0) {
    const { data, error } = await supabase
      .from("autorizaciones_protagonistas")
      .select("id,id_protagonista,id_autorizacion,anio_vigencia,entregada")
      .eq("anio_vigencia", anio)
      .in("id_protagonista", protaIds)
      .in("id_autorizacion", autIds);

    if (!error) autProta = (data ?? []) as AutProtaRow[];
  }

  // Map: prota -> authId -> row
  const byProta = new Map<number, Map<number, AutProtaRow>>();
  for (const r of autProta) {
    if (!byProta.has(r.id_protagonista)) byProta.set(r.id_protagonista, new Map());
    byProta.get(r.id_protagonista)!.set(r.id_autorizacion, r);
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Autorizaciones por protagonista ({anio})
            </h1>
          </div>
        </div>

        {/* Filtros reutilizados */}
        <TableFilters
          ramas={[...RAMAS]}
          initialQ={q}
          initialRama={rama}
          initialActivo={activo}
        />

        {(autErr || protasErr) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            Error: {autErr?.message ?? protasErr?.message}
          </div>
        )}

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1250px] w-full whitespace-nowrap text-sm">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                    Protagonista
                  </th>
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3">Activo</th>

                  {auts.map((a) => (
                    <th key={a.id} className="px-4 py-3">
                      {a.nombre_autorizacion}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {protasTyped.map((p) => {
                  const row = byProta.get(p.id) ?? new Map<number, AutProtaRow>();

                  return (
                    <tr key={p.id} className="text-gray-700 dark:text-gray-300 align-top">
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 z-10">
                        <div className="font-semibold">
                          {p.apellido}, {p.nombre}
                        </div>
                      </td>

                      <td className="px-4 py-3">{p.rama}</td>

                      <td className="px-4 py-3">
                        <span className={pillClass(p.activo)}>{p.activo ? "Activo" : "Inactivo"}</span>
                      </td>

                      {auts.map((a) => {
                        const r = row.get(a.id);

                        return (
                          <td key={a.id} className="px-4 py-3">
                            <AutorizacionCellConfirm
                              registro={r}
                              marcarEntregadaAction={marcarAutorizacionEntregadaAction}
                              marcarNoEntregadaAction={marcarAutorizacionNoEntregadaAction}
                              labelAutorizacion={a.nombre_autorizacion}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {protasTyped.length === 0 && (
                  <tr>
                    <td colSpan={3 + auts.length} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
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
            Total: {protasTyped.length}
          </div>
        </div>

        {auts.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            No hay autorizaciones activas. Crealas en <b>Admin → Autorizaciones</b>.
          </div>
        )}
      </div>
    </main>
  );
}
