import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { deleteCursoEducadorAction } from "../../actions";

export default async function EliminarCursoEducadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rowId = Number(id);

  const supabase = await createSupabaseServer();

  const { data: row, error } = await supabase
    .from("cursos_educadores")
    .select(
      `
      id,
      rama,
      cursos:cursos!cursos_educadores_id_curso_fkey ( nombre_curso ),
      educadores:educadores!cursos_educadores_id_educador_fkey ( nombre, apellido )
    `
    )
    .eq("id", rowId)
    .single();

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!row) return <div className="p-6">No encontrado.</div>;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-xl">
        <div className="mb-6">
          <Link href="/admin/cursos-educadores" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
            Eliminar registro
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Vas a eliminar el registro de curso realizado:
          </p>

          <div className="rounded-lg border p-4">
            <div className="font-semibold">
              {(row as any).educadores?.apellido}, {(row as any).educadores?.nombre}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Curso: {(row as any).cursos?.nombre_curso ?? "—"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Rama (registro): {(row as any).rama ?? "—"}
            </div>
          </div>

          <form action={deleteCursoEducadorAction} className="flex justify-end gap-3">
            <input type="hidden" name="id" value={rowId} />
            <Link href="/admin/cursos-educadores" className="px-4 py-2 rounded-lg border">
              Cancelar
            </Link>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold">
              Sí, eliminar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
