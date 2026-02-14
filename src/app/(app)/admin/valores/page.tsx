import { createSupabaseServer } from "@/lib/supabase/server";
import { crearNuevoValorCuotaAction } from "../cuotas/actions";
import ValorFormConfirm from "@/components/ValorFormConfirm";

function formatARDateTime(dateString: string) {
  // created_at viene como timestamp -> Date normal
  return new Date(dateString).toLocaleString("es-AR");
}

function formatMoneyARS(value: any) {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("es-AR")}`;
}

function TipoPill({ tipo }: { tipo: string }) {
  const base = "px-2 py-1 font-semibold leading-tight rounded-full text-xs";
  const t = (tipo ?? "").toLowerCase();

  if (t.includes("afili")) {
    return (
      <span
        className={`${base} bg-[#FCDB52] text-gray-900
                    dark:bg-[#FCDB52] dark:text-gray-900`}
      >
        Afiliación
      </span>
    );
  }

  if (t.includes("cuota")) {
    return (
      <span
        className={`${base} bg-[#F3D146] text-gray-900
                    dark:bg-[#F3D146] dark:text-gray-900`}
      >
        Cuota
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-gray-100 text-gray-700
                  dark:bg-gray-700 dark:text-gray-100`}
    >
      {tipo}
    </span>
  );
}


export default async function ValoresPage() {
  const supabase = await createSupabaseServer();

  const { data: valores, error } = await supabase
    .from("cuota_valores")
    .select("id, created_at, valor, tipo")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Actualizar valores</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
              Cada vez que se carga un nuevo valor de afiliación o cuota, automáticamente las cuotas impagas
              posteriores al mes actual se actualizan con el nuevo valor.
            </p>
          </div>
        </div>

        {/* Form con confirmación */}
        <div className="rounded-lg shadow bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Cargar nuevo valor
          </div>
          <ValorFormConfirm action={crearNuevoValorCuotaAction} />
        </div>

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {(valores ?? []).map((v: any) => (
                  <tr key={v.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3 text-sm">{formatARDateTime(v.created_at)}</td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <TipoPill tipo={v.tipo} />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold">{formatMoneyARS(v.valor)}</td>
                  </tr>
                ))}

                {(valores?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      Sin valores cargados.
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
            Últimos: {valores?.length ?? 0}
          </div>
        </div>
      </div>
    </main>
  );
}
