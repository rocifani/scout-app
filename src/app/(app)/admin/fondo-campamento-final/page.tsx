import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import { createFondoCampamentoAction, deleteFondoCampamentoAction } from "./actions";

type Protagonista = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  activo: boolean;
};

type FondoRow = {
  id: number;
  id_protagonista: number;
  monto: number;
  observaciones: string | null;
  created_at: string;
};

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function formatARDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR");
}

export default async function AdminFondoCampamentoFinalPage() {
  const supabase = await createSupabaseServerReadOnly();

  const { data: protas, error: pErr } = await supabase
    .from("protagonistas")
    .select("id,nombre,apellido,rama,activo")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (pErr) return <div className="p-6 text-red-600">Error protagonistas: {pErr.message}</div>;
  const protagonistas = (protas ?? []) as Protagonista[];

  const { data: fondos, error: fErr } = await supabase
    .from("fondo_campamento_final")
    .select("id,id_protagonista,monto,observaciones,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (fErr) return <div className="p-6 text-red-600">Error fondo: {fErr.message}</div>;
  const fondosRows = (fondos ?? []) as FondoRow[];

  const protaById = new Map(protagonistas.map((p) => [p.id, p]));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
          Fondo Campamento Final · Aportes
        </h1>

        {/* Alta */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Cargar Aporte</h2>

          <form action={createFondoCampamentoAction} className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs text-gray-600 dark:text-gray-300">Protagonista</label>
              <select
                name="id_protagonista"
                required
                className="mt-1 h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
              >
                <option value="">Seleccionar...</option>
                {protagonistas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre} · {p.rama} {p.activo ? "" : "(Inactivo)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-gray-600 dark:text-gray-300">Monto</label>
              <input
                name="monto"
                inputMode="decimal"
                required
                placeholder="0,00"
                className="mt-1 h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
              />
            </div>

            <div className="md:col-span-6">
              <label className="text-xs text-gray-600 dark:text-gray-300">Observaciones</label>
              <input
                name="observaciones"
                placeholder="Ej: Aporte MP / Banco / Fecha / Referencia"
                className="mt-1 h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
              />
            </div>

            <div className="md:col-span-6">
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold text-sm">
                Guardar
              </button>
            </div>
          </form>
        </div>

        {/* Listado */}
        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                               dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                  <th className="px-4 py-3">Protagonista</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Obs.</th>
                  <th className="px-4 py-3">Fecha carga</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {fondosRows.map((r) => {
                  const p = protaById.get(r.id_protagonista);
                  return (
                    <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3 font-semibold">
                        {p ? `${p.apellido}, ${p.nombre}` : `Protagonista #${r.id_protagonista}`}
                        {p ? <div className="text-xs text-gray-500">{p.rama}</div> : null}
                      </td>
                      <td className="px-4 py-3 font-semibold">${money(r.monto)}</td>
                      <td className="px-4 py-3">{r.observaciones ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {formatARDateTime(r.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <form action={deleteFondoCampamentoAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                            Borrar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}

                {fondosRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      Todavía no hay aportes cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
