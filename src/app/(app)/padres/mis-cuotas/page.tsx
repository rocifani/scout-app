import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

const MESES = [
  { label: "Abr", month: 4 },
  { label: "May", month: 5 },
  { label: "Jun", month: 6 },
  { label: "Jul", month: 7 },
  { label: "Ago", month: 8 },
  { label: "Sep", month: 9 },
  { label: "Oct", month: 10 },
  { label: "Nov", month: 11 },
  { label: "Dic", month: 12 },
] as const;

function periodoISO(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function pillClass(active: boolean) {
  return active
    ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
    : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
}

type CuotaRaw = {
  id: number;
  id_protagonista: number;
  periodo: string;
  tipo_pago: "cuota" | "afiliacion";
  fecha_pago: string | null;
  cuota_valor: { valor: number } | null;
};

type ProtaRow = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  activo: boolean;
};

function CuotaCellReadOnly({ cuota }: { cuota?: CuotaRaw }) {
  if (!cuota) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const pagada = !!cuota.fecha_pago;
  const valor = cuota.cuota_valor?.valor ?? null;

  return (
    <div className="space-y-1">
      <span className={pillClass(pagada)}>
        {pagada ? "Pagada" : "Impaga"}
      </span>

      {valor !== null && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          ${valor.toLocaleString("es-AR")}
        </div>
      )}
    </div>
  );
}

export default async function MisCuotasPage() {
  const supabase = await createSupabaseServer();

  // 1) usuario logueado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2) obtener padre por auth_user_id
  const { data: padre, error: padreErr } = await supabase
    .from("padres")
    .select("id, nombre, apellido, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (padreErr) return <div className="p-6 text-red-600">Error: {padreErr.message}</div>;

  if (!padre) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
          <Link href="/" className="text-sm text-gray-600 hover:underline">← Volver</Link>

          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Detalle de cuotas</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Tu usuario no está vinculado a un padre/tutor en el sistema.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3) traer protagonistas del padre (join)
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

  // 4) cuotas del año actual Abr-Dic
  const year = new Date().getFullYear();
  const from = periodoISO(year, 4);
  const to = periodoISO(year, 12);

  const { data: cuotas, error: cuotasErr } =
    protaIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("cuotas")
          .select(
            "id,id_protagonista,periodo,tipo_pago,fecha_pago, cuota_valor:cuota_valores!cuotas_id_valor_fkey(valor)"
          )
          .in("id_protagonista", protaIds)
          .gte("periodo", from)
          .lte("periodo", to);

  if (cuotasErr) return <div className="p-6 text-red-600">Error: {cuotasErr.message}</div>;

  const cuotasTyped = (cuotas ?? []) as unknown as CuotaRaw[];

  // 5) index por protagonista + periodo
  const byProta = new Map<number, Record<string, CuotaRaw>>();
  for (const c of cuotasTyped) {
    const pid = c.id_protagonista;
    if (!byProta.has(pid)) byProta.set(pid, {});
    const key = c.tipo_pago === "afiliacion" ? "afiliacion" : c.periodo;
    byProta.get(pid)![key] = c;
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-gray-600 hover:underline">← Volver</Link>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-2">
              Detalle de cuotas {year}
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
                  <th className="px-4 py-3">Afiliación</th>
                  {MESES.map((m) => (
                    <th key={m.month} className="px-4 py-3">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {protasTyped.map((p) => {
                  const row = byProta.get(p.id) ?? {};
                  const afili = row["afiliacion"];

                  return (
                    <tr key={p.id} className="text-gray-700 dark:text-gray-300 align-top">
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 z-10">
                        <div className="font-semibold">
                          {p.apellido}, {p.nombre}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <CuotaCellReadOnly cuota={afili} />
                      </td>

                      {MESES.map((m) => {
                        const key = periodoISO(year, m.month);
                        const cuota = row[key];

                        return (
                          <td key={m.month} className="px-4 py-3">
                            <CuotaCellReadOnly cuota={cuota} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {protasTyped.length === 0 && (
                  <tr>
                    <td
                      colSpan={4 + MESES.length}
                      className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400"
                    >
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
      </div>
    </main>
  );
}
