import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updateCarpa, deleteCarpa } from "./actions";

type Carpa = {
  id: number;
  created_at: string;
  numero_carpa: number | null;
  observaciones: string | null;
  url_foto: string | null;
};

export default async function EditarCarpaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const errorMsg = sp.error ? decodeURIComponent(sp.error) : null;

  const carpaId = Number(id);
  if (Number.isNaN(carpaId)) {
    return <div className="p-6 text-red-600">ID inválido.</div>;
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("carpas")
    .select("id, created_at, numero_carpa, observaciones, url_foto")
    .eq("id", carpaId)
    .single();

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!data) return <div className="p-6">No se encontró la carpa.</div>;

  const c = data as Carpa;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Editar carpa {c.numero_carpa ? `#${c.numero_carpa}` : ""}
          </h1>

          <Link
            href="/admin/carpas"
            className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Volver
          </Link>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {errorMsg}
          </div>
        )}

        <form
          action={async (formData) => {
            "use server";
            const res = await updateCarpa(carpaId, formData);
            if (res?.ok === false) {
              // En server actions: para mostrar error simple sin client component,
              // redirigimos a la misma página con querystring.
              const msg = encodeURIComponent(res.error ?? "Error al actualizar.");
              return (await import("next/navigation")).redirect(
                `/admin/carpas/${carpaId}/editar?error=${msg}`
              );
            }
          }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6"
        >
          <div className="grid gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Número de carpa
              </label>
              <input
                name="numero_carpa"
                type="number"
                inputMode="numeric"
                defaultValue={c.numero_carpa ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                rows={4}
                defaultValue={c.observaciones ?? ""}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                URL de foto
              </label>
              <input
                name="url_foto"
                type="url"
                defaultValue={c.url_foto ?? ""}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              />
              {c.url_foto?.trim() ? (
                <div className="mt-2">
                  <a
                    href={c.url_foto}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Ver foto actual
                  </a>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                           bg-[#FCDB52] text-gray-900
                           hover:bg-[#F3D146] active:bg-[#E9C83D]
                           focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              >
                Guardar cambios
              </button>

              <Link
                href="/admin/carpas"
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700
                           text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </Link>

              <form
                action={async () => {
                  "use server";
                  const res = await deleteCarpa(carpaId);
                  if (res?.ok === false) {
                    const msg = encodeURIComponent(res.error ?? "Error al eliminar.");
                    return (await import("next/navigation")).redirect(
                      `/admin/carpas/${carpaId}/editar?error=${msg}`
                    );
                  }
                }}
                className="ml-auto"
              >
              
              </form>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
