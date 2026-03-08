import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

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

function EstadoEntregaCell({ registro }: { registro?: AutProtaRow }) {
  if (!registro) return <span className="text-xs text-gray-400">—</span>;

  const entregada = registro.entregada === true;
  return <span className={pillClass(entregada)}>{entregada ? "Entregada" : "No entregada"}</span>;
}

export default async function MisAutorizacionesPage() {
  const supabase = await createSupabaseServer();
  const anio = new Date().getFullYear();

  // 1) user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2) padre
  const { data: padre, error: padreErr } = await supabase
    .from("padres")
    .select("id,nombre,apellido,email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (padreErr) return <div className="p-6 text-red-600">Error: {padreErr.message}</div>;
  if (!padre) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
          <Link href="/" className="text-sm text-gray-600 hover:underline">← Volver</Link>
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Detalle de autorizaciones</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Tu usuario no está vinculado a un padre/tutor en el sistema.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3) autorizaciones activas (columnas)
  const { data: autorizaciones, error: autErr } = await supabase
    .from("autorizaciones")
    .select("id,nombre_autorizacion,activo")
    .eq("activo", true)
    .order("nombre_autorizacion", { ascending: true });

  if (autErr) return <div className="p-6 text-red-600">Error: {autErr.message}</div>;

  const auts = (autorizaciones ?? []) as AutorizacionRow[];
  const autIds = auts.map((a) => a.id);

  // 4) hijos del padre (filas)
  const { data: rels, error: relErr } = await supabase
    .from("padres_protagonistas")
    .select("id_protagonista, protagonistas:protagonistas(id,nombre,apellido,rama,activo)")
    .eq("id_padre", padre.id);

  if (relErr) return <div className="p-6 text-red-600">Error: {relErr.message}</div>;

  const protasTyped: ProtaRow[] = (rels ?? [])
    .map((r: any) => r.protagonistas as ProtaRow)
    .filter(Boolean)
    .sort((a, b) => {
      const ap = (a.apellido || "").localeCompare(b.apellido || "");
      if (ap !== 0) return ap;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });

  const protaIds = protasTyped.map((p) => p.id);

  // 5) traer autorizaciones_protagonistas del año (solo para esos hijos)
  let autProta: AutProtaRow[] = [];
  if (protaIds.length > 0 && autIds.length > 0) {
    const { data, error } = await supabase
      .from("autorizaciones_protagonistas")
      .select("id,id_protagonista,id_autorizacion,anio_vigencia,entregada")
      .eq("anio_vigencia", anio)
      .in("id_protagonista", protaIds)
      .in("id_autorizacion", autIds);

    if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
    autProta = (data ?? []) as AutProtaRow[];
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
            <Link href="/" className="text-sm text-gray-600 hover:underline">← Volver</Link>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-2">
              Detalle de autorizaciones 
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {padre.apellido}, {padre.nombre} · {padre.email}
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="min-w-312.5 w-full whitespace-nowrap text-sm">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                    Protagonista
                  </th>
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

                      

                      {auts.map((a) => {
                        const r = row.get(a.id);
                        return (
                          <td key={a.id} className="px-4 py-3">
                            <EstadoEntregaCell registro={r} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {protasTyped.length === 0 && (
                  <tr>
                    <td colSpan={3 + auts.length} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No tenés protagonistas vinculados todavía.
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
            No hay autorizaciones activas.
          </div>
        )}
      </div>
    </main>
  );
}
