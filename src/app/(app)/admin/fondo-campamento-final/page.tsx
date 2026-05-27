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

type VentaDetalle = {
  id: number;
  ganancia_individual: number | null;
};

type LineaVenta = {
  id_protagonista: number;
  id_venta_detalle: number;
  cantidad: number;
};

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function formatARDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR");
}

function pct(value: number, max: number) {
  if (max === 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

function EstadoBadge({ total }: { total: number }) {
  if (total <= 0)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        Sin movimiento
      </span>
    );
  if (total < 5000)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300">
        Iniciando
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
      Activo
    </span>
  );
}

export default async function AdminFondoCampamentoFinalPage() {
  const supabase = await createSupabaseServerReadOnly();

  // ── Protagonistas ──────────────────────────────────────────────────────────
  const { data: protas, error: pErr } = await supabase
    .from("protagonistas")
    .select("id,nombre,apellido,rama,activo")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (pErr) return <div className="p-6 text-red-600">Error protagonistas: {pErr.message}</div>;
  const protagonistas = (protas ?? []) as Protagonista[];
  const protaIds = protagonistas.map((p) => p.id);

  // ── Aportes al fondo ───────────────────────────────────────────────────────
  const { data: fondos, error: fErr } = await supabase
    .from("fondo_campamento_final")
    .select("id,id_protagonista,monto,observaciones,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (fErr) return <div className="p-6 text-red-600">Error fondo: {fErr.message}</div>;
  const fondosRows = (fondos ?? []) as FondoRow[];

  // ── Ventas: ganancias por protagonista ─────────────────────────────────────
  const { data: linesRaw, error: lErr } = protaIds.length
    ? await supabase
        .from("ventas_compras")
        .select("id_protagonista,id_venta_detalle,cantidad")
        .eq("comprador_tipo", "protagonista")
        .in("id_protagonista", protaIds)
    : { data: [], error: null };

  if (lErr) return <div className="p-6 text-red-600">Error ventas: {lErr.message}</div>;
  const lines = (linesRaw ?? []) as LineaVenta[];

  const detalleIds = Array.from(new Set(lines.map((l) => l.id_venta_detalle)));
  const { data: detsRaw, error: dErr } = detalleIds.length
    ? await supabase
        .from("ventas_detalle")
        .select("id,ganancia_individual")
        .in("id", detalleIds)
    : { data: [], error: null };

  if (dErr) return <div className="p-6 text-red-600">Error productos: {dErr.message}</div>;
  const detById = new Map(
    ((detsRaw ?? []) as VentaDetalle[]).map((d) => [d.id, d])
  );

  // ── Acumular por protagonista ──────────────────────────────────────────────
  const gananciaByProta = new Map<number, number>();
  for (const ln of lines) {
    const det = detById.get(ln.id_venta_detalle);
    if (!det) continue;
    const g = (det.ganancia_individual ?? 0) * ln.cantidad;
    gananciaByProta.set(ln.id_protagonista, (gananciaByProta.get(ln.id_protagonista) ?? 0) + g);
  }

  const fondoByProta = new Map<number, number>();
  for (const f of fondosRows) {
    const m = Number(f.monto ?? 0);
    fondoByProta.set(f.id_protagonista, (fondoByProta.get(f.id_protagonista) ?? 0) + (Number.isFinite(m) ? m : 0));
  }

  type ResumenRow = {
    id: number;
    nombre: string;
    rama: string;
    ganancia: number;
    fondo: number;
    total: number;
  };

  const resumen: ResumenRow[] = protagonistas.map((p) => {
    const ganancia = gananciaByProta.get(p.id) ?? 0;
    const fondo = fondoByProta.get(p.id) ?? 0;
    return { id: p.id, nombre: `${p.apellido}, ${p.nombre}`, rama: p.rama, ganancia, fondo, total: ganancia + fondo };
  });
  resumen.sort((a, b) => b.total - a.total);

  const totalGanancia = resumen.reduce((acc, r) => acc + r.ganancia, 0);
  const totalFondo = resumen.reduce((acc, r) => acc + r.fondo, 0);
  const totalGeneral = totalGanancia + totalFondo;
  const maxTotal = resumen.length ? Math.max(...resumen.map((r) => r.total), 1) : 1;
  const protaById = new Map(protagonistas.map((p) => [p.id, p]));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
          Fondo Campamento Final · Aportes
        </h1>

        {/* ── Formulario de carga ── */}
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

        {/* ── Seguimiento por protagonista ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Seguimiento por protagonista</h2>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                  <th className="px-4 py-3">Protagonista</th>
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3">Ganancia ventas</th>
                  <th className="px-4 py-3">Aportes fondo</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {resumen.map((r) => {
                  const p = pct(r.total, maxTotal);
                  return (
                    <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3 font-semibold">{r.nombre}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{r.rama}</td>
                      <td className="px-4 py-3">
                        {r.ganancia > 0
                          ? <span className="font-semibold">${money(r.ganancia)}</span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.fondo > 0
                          ? <span className="font-semibold">${money(r.fondo)}</span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 font-bold">${money(r.total)}</td>
                      
                    </tr>
                  );
                })}
                {resumen.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No hay protagonistas.</td>
                  </tr>
                )}
              </tbody>
              {resumen.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 font-bold text-gray-800 dark:text-gray-200 text-sm">
                    <td className="px-4 py-3" colSpan={2}>
                      <span className="text-xs uppercase tracking-wide text-gray-400">Total general</span>
                    </td>
                    <td className="px-4 py-3">${money(totalGanancia)}</td>
                    <td className="px-4 py-3">${money(totalFondo)}</td>
                    <td className="px-4 py-3 text-base">${money(totalGeneral)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Historial de aportes ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Historial de aportes</h2>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
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
                        {p && <div className="text-xs text-gray-500">{p.rama}</div>}
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
