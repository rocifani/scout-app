import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import AutorizacionForm from "@/components/AutorizacionForm";
import { updateAutorizacionAction, setAutorizacionActivaAction } from "./actions";

export default async function EditarAutorizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const autorizacionId = Number(id);

  const supabase = await createSupabaseServer();

  const { data: a, error } = await supabase
    .from("autorizaciones")
    .select("id, nombre_autorizacion, activo")
    .eq("id", autorizacionId)
    .single();

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!a) return <div className="p-6">No encontrado.</div>;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/autorizaciones" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              Editar autorización
            </h1>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              a.activo
                ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
            }`}
          >
            {a.activo ? "Activa" : "Inactiva"}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <AutorizacionForm
            title="Datos de la autorización"
            submitLabel="Guardar cambios"
            action={updateAutorizacionAction}
            defaultValues={{ id: a.id, nombre_autorizacion: a.nombre_autorizacion }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Estado</h2>

          {a.activo ? (
            <form action={setAutorizacionActivaAction}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="activo" value="false" />
              <button type="submit" className="px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100">
                Dar de baja
              </button>
            </form>
          ) : (
            <form action={setAutorizacionActivaAction}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="activo" value="true" />
              <button type="submit" className="px-4 py-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100">
                Reactivar
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
