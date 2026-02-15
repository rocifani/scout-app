import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updateCursoAction, setCursoSistemaActualAction } from "./actions";

type Curso = {
  id: number;
  nombre_curso: string;
  sistema_actual: boolean;
};

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cursoId = Number(id);

  const supabase = await createSupabaseServer();

  const { data: c, error } = await supabase
    .from("cursos")
    .select("id,nombre_curso,sistema_actual")
    .eq("id", cursoId)
    .single();

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!c) return <div className="p-6">No encontrado.</div>;

  const curso = c as Curso;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/cursos" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              Editar curso
            </h1>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              curso.sistema_actual
                ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
            }`}
          >
            {curso.sistema_actual ? "Vigente" : "No vigente"}
          </span>
        </div>

        {/* Editar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Datos del curso</h2>

          <form action={updateCursoAction} className="space-y-4">
            <input type="hidden" name="id" value={curso.id} />

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
              <input
                name="nombre_curso"
                defaultValue={curso.nombre_curso}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/admin/cursos" className="px-4 py-2 rounded-lg border">
                Cancelar
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                           bg-[#FCDB52] text-gray-900
                           hover:bg-[#F3D146] active:bg-[#E9C83D]
                           focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

        {/* Estado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Estado</h2>

          {curso.sistema_actual ? (
            <form action={setCursoSistemaActualAction}>
              <input type="hidden" name="id" value={curso.id} />
              <input type="hidden" name="sistema_actual" value="false" />
              <button type="submit" className="px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100">
                Desactivar curso
              </button>
            </form>
          ) : (
            <form action={setCursoSistemaActualAction}>
              <input type="hidden" name="id" value={curso.id} />
              <input type="hidden" name="sistema_actual" value="true" />
              <button type="submit" className="px-4 py-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100">
                Reactivar curso
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
