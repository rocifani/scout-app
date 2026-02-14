// src/app/(app)/admin/cuotas/page.tsx
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { marcarCuotaPagadaAction, marcarCuotaImpagaAction } from "./actions";
import CuotaCellConfirm from "@/components/CuotaCellConfirm";

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
  cuota_valor: { valor: number } | null; // ✅ objeto
};

type ProtaRow = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  activo: boolean;
};

export default async function AdminCuotasPage() {
  const supabase = await createSupabaseServer();
  const year = new Date().getFullYear();

  const from = periodoISO(year, 4);
  const to = periodoISO(year, 12);

  const { data: protas, error: protasErr } = await supabase
    .from("protagonistas")
    .select("id,nombre,apellido,rama,activo")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  const { data: cuotas, error: cuotasErr } = await supabase
  .from("cuotas")
  .select("id,id_protagonista,periodo,tipo_pago,fecha_pago, cuota_valor:cuota_valores!cuotas_id_valor_fkey(valor)")
  .gte("periodo", from)
  .lte("periodo", to);


  const protasTyped = (protas ?? []) as ProtaRow[];
  const cuotasTyped = (cuotas ?? []) as unknown as CuotaRaw[];

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
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Administrar cuotas {year}
            </h1>
          </div>

        
        </div>

        {(protasErr || cuotasErr) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            Error: {protasErr?.message ?? cuotasErr?.message}
          </div>
        )}

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
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3">Activo</th>
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
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID {p.id}</div>
                      </td>

                      <td className="px-4 py-3">{p.rama}</td>

                      <td className="px-4 py-3">
                        <span className={pillClass(p.activo)}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <CuotaCellConfirm
                          cuota={afili}
                          pagarAction={marcarCuotaPagadaAction}
                          impagarAction={marcarCuotaImpagaAction}
                        />
                      </td>

                      {MESES.map((m) => {
                        const key = periodoISO(year, m.month);
                        const cuota = row[key];

                        return (
                          <td key={m.month} className="px-4 py-3">
                            <CuotaCellConfirm
                              cuota={cuota}
                              pagarAction={marcarCuotaPagadaAction}
                              impagarAction={marcarCuotaImpagaAction}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {protasTyped.length === 0 && (
                  <tr>
                    <td colSpan={4 + MESES.length} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay protagonistas.
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

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Nota: Afiliación solo aparece si la guardás como fila en <code>cuotas</code> con{" "}
          <code>tipo_pago='afiliacion'</code> y un <code>periodo</code> dentro de Abril–Diciembre.
        </p>
      </div>
    </main>
  );
}
