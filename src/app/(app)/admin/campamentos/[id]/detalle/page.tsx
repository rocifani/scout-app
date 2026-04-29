import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  toggleAsisteAction,
  togglePagoAction,
  createGastoAction,
  togglePagadoGastoAction,
  deleteGastoAction,
} from "./actions";

type Props = { params: Promise<{ id: string }> };

export default async function DetalleCampamentoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // Campamento
  const { data: campamento, error: cErr } = await supabase
    .from("campamentos")
    .select("id, lugar, fecha_inicio, fecha_fin, costo")
    .eq("id", id)
    .single();

  if (cErr || !campamento) notFound();

  // Todos los protagonistas + su estado en este campamento
  const { data: protagonistas, error: pErr } = await supabase
    .from("protagonistas")
    .select(`
      id, nombre, apellido,
      campamentos_protagonistas!left(asiste, pago, id_campamento)
    `)
    .eq("activo", true)
    .order("apellido", { ascending: true });

  if (pErr) return <div className="p-6 text-red-600">Error: {pErr.message}</div>;

  const protas = (protagonistas ?? []).map((p) => {
    const rel = (p.campamentos_protagonistas ?? []).find(
      (r: { id_campamento: string }) => r.id_campamento === id
    );
    return {
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      asiste: rel?.asiste ?? false,
      pago: rel?.pago ?? false,
    };
  });

  // Gastos
  const { data: gastos, error: gErr } = await supabase
    .from("campamentos_gastos")
    .select("id, descripcion, monto, pagado")
    .eq("id_campamento", id)
    .order("created_at", { ascending: true });

  if (gErr) return <div className="p-6 text-red-600">Error: {gErr.message}</div>;

  // Resumen financiero
  const asistentes = protas.filter((p) => p.asiste);
  const pagaron = protas.filter((p) => p.asiste && p.pago);
  const presupuesto = asistentes.length * campamento.costo;
  const recaudado = pagaron.length * campamento.costo;
  const totalGastos = (gastos ?? []).reduce((acc, g) => acc + g.monto, 0);
  const gastosPagados = (gastos ?? []).filter((g) => g.pagado).reduce((acc, g) => acc + g.monto, 0);
  const saldo = recaudado - gastosPagados;

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  // Actions con bind
  const addGasto = createGastoAction.bind(null, id);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl space-y-8">

        {/* Header */}
        <div>
          <Link href="/admin/campamentos" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
            ← Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {campamento.lugar}
            </h1>
            <Link
              href={`/admin/campamentos/${id}/editar`}
              className="text-sm px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Editar
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date(campamento.fecha_inicio + "T00:00:00").toLocaleDateString("es-AR")} →{" "}
            {new Date(campamento.fecha_fin + "T00:00:00").toLocaleDateString("es-AR")} · Costo por persona: {fmt(campamento.costo)}
          </p>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Presupuesto", value: fmt(presupuesto), sub: `${asistentes.length} asistentes` },
            { label: "Recaudado", value: fmt(recaudado), sub: `${pagaron.length} pagaron` },
            { label: "Gastos totales", value: fmt(totalGastos), sub: `${fmt(gastosPagados)} pagados` },
            {
              label: "Saldo",
              value: fmt(saldo),
              sub: saldo >= 0 ? "superávit" : "déficit",
              highlight: saldo >= 0 ? "text-green-600" : "text-red-600",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                {card.label}
              </p>
              <p className={`text-xl font-bold ${card.highlight ?? "text-gray-800 dark:text-gray-100"}`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Lista de protagonistas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b dark:border-gray-700">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">Protagonistas</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {asistentes.length} asisten · {pagaron.length} pagaron
            </p>
          </div>

          <div className="divide-y dark:divide-gray-700">
            {protas.map((p) => {
              const toggleAsiste = toggleAsisteAction.bind(null, id, p.id, !p.asiste);
              const togglePago   = togglePagoAction.bind(null, id, p.id, !p.pago);

              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {p.apellido}, {p.nombre}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Asiste */}
                    <form action={toggleAsiste}>
                      <button
                        type="submit"
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors
                          ${p.asiste
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                      >
                        {p.asiste ? "Asiste ✓" : "Asiste"}
                      </button>
                    </form>

                    {/* Pagó */}
                    <form action={togglePago}>
                      <button
                        type="submit"
                        disabled={!p.asiste}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors
                          disabled:opacity-30 disabled:cursor-not-allowed
                          ${p.pago
                            ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                      >
                        {p.pago ? "Pagó ✓" : "Pagó"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b dark:border-gray-700">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">Gastos</h2>
          </div>

          {/* Formulario nuevo gasto */}
          <form action={addGasto} className="flex items-end gap-3 px-5 py-4 border-b dark:border-gray-700">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Descripción
              </label>
              <input
                name="descripcion"
                type="text"
                required
                placeholder="Ej: Comida, transporte..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                           px-3 py-2 text-sm text-gray-800 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/60"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Monto ($)
              </label>
              <input
                name="monto"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                           px-3 py-2 text-sm text-gray-800 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/60"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg
                         bg-[#FCDB52] text-gray-900
                         hover:bg-[#F3D146] active:bg-[#E9C83D]
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            >
              Agregar
            </button>
          </form>

          {/* Lista de gastos */}
          <div className="divide-y dark:divide-gray-700">
            {(gastos ?? []).length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">No hay gastos registrados.</p>
            )}

            {(gastos ?? []).map((g) => {
              const togglePagado = togglePagadoGastoAction.bind(null, id, g.id, !g.pagado);
              const eliminar     = deleteGastoAction.bind(null, id, g.id);

              return (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{g.descripcion}</p>
                    <p className="text-xs text-gray-400">{fmt(g.monto)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <form action={togglePagado}>
                      <button
                        type="submit"
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors
                          ${g.pagado
                            ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                      >
                        {g.pagado ? "Pagado ✓" : "Pendiente"}
                      </button>
                    </form>

                    <form action={eliminar}>
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>

          {(gastos ?? []).length > 0 && (
            <div className="px-5 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50
                            flex justify-between text-sm">
              <span className="text-gray-500">Total gastos</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(totalGastos)}</span>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}