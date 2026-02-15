import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import CursosEducadoresFilters from "@/components/CursosEducadoresFilters";
import { deleteCursoEducadorAction } from "./actions";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;

type Row = {
  id: number;
  rama: string | null;
  educador: { id: number; nombre: string; apellido: string; activo: boolean } | null;
  curso: { id: number; nombre_curso: string; sistema_actual: boolean } | null;
};

function EstadoPill({ ok }: { ok: boolean }) {
  const base = "px-2 py-1 font-semibold leading-tight rounded-full text-xs";
  return ok ? (
    <span className={`${base} text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100`}>Sistema actual</span>
  ) : (
    <span className={`${base} text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-100`}>Sistema viejo</span>
  );
}

export default async function CursosEducadoresPage({
  searchParams,
}: {
  searchParams?: Promise<{
    toast?: string;
    q?: string;
    educador?: string; // id
    curso?: string; // id
    rama?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};

  const toast = sp.toast ? decodeURIComponent(sp.toast) : null;
  const q = (sp.q ?? "").trim();
  const educador = (sp.educador ?? "").trim();
  const curso = (sp.curso ?? "").trim();
  const rama = (sp.rama ?? "").trim();

  const supabase = await createSupabaseServer();

  // combos
  const { data: educadoresData } = await supabase
    .from("educadores")
    .select("id,nombre,apellido,activo")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  const { data: cursosData } = await supabase
    .from("cursos")
    .select("id,nombre_curso,sistema_actual")
    .order("nombre_curso", { ascending: true });

  const educadoresOpts =
    (educadoresData ?? []).map((e) => ({
      id: e.id as number,
      label: `${e.apellido}, ${e.nombre}${e.activo ? "" : " (Inactivo)"}`,
    })) ?? [];

  const cursosOpts =
    (cursosData ?? []).map((c) => ({
      id: c.id as number,
      label: `${c.nombre_curso}${c.sistema_actual ? "" : " (Inactivo)"}`,
    })) ?? [];

  // listado base
  let query = supabase
    .from("cursos_educadores")
    .select(
      `
      id,
      rama,
      educador:educadores ( id, nombre, apellido, activo ),
      curso:cursos ( id, nombre_curso, sistema_actual )
    `
    );

  if (educador) query = query.eq("id_educador", Number(educador));
  if (curso) query = query.eq("id_curso", Number(curso));
  if (rama) query = query.eq("rama", rama);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const rows = (data ?? []) as unknown as Row[];

  // 🔎 búsqueda por texto (server-side en memoria, suficiente para este volumen)
  const qLower = q.toLowerCase();
  const filtered = q
    ? rows.filter((r) => {
        const e = r.educador ? `${r.educador.apellido} ${r.educador.nombre}`.toLowerCase() : "";
        const c = r.curso?.nombre_curso?.toLowerCase() ?? "";
        return e.includes(qLower) || c.includes(qLower);
      })
    : rows;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {toast && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Cursos realizados</h1>

          <Link
            href="/admin/cursos-educadores/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            Registrar curso <span aria-hidden>+</span>
          </Link>
        </div>

        <CursosEducadoresFilters
          initialQ={q}
          initialEducador={educador}
          initialCurso={curso}
          initialRama={rama}
          educadores={educadoresOpts}
          cursos={cursosOpts}
          ramas={[...RAMAS]}
        />

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Educador</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {filtered.map((r) => {
                  const eduLabel = r.educador ? `${r.educador.apellido}, ${r.educador.nombre}` : "—";
                  const cursoLabel = r.curso?.nombre_curso ?? "—";
                  const cursoOk = !!r.curso?.sistema_actual;

                  return (
                    <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3 text-sm">{eduLabel}</td>
                      <td className="px-4 py-3 text-sm">
                        <EstadoPill ok={cursoOk} />
                      </td>
                      <td className="px-4 py-3 text-sm">{cursoLabel}</td>
                      <td className="px-4 py-3 text-sm">{r.rama ?? "—"}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/cursos-educadores/${r.id}/editar`}
                            className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200
                                       hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          >
                            Editar
                          </Link>

                        <DeleteConfirmButton
                            action={deleteCursoEducadorAction}
                            id={r.id}
                            title="Confirmar eliminación"
                            description={
                                <>
                                <p className="text-sm">
                                    Vas a eliminar este registro de <span className="font-semibold">curso + educador</span>.
                                </p>
                                <p className="mt-2 text-xs text-gray-500">
                                    Esta acción no se puede deshacer.
                                </p>
                                </>
                            }
                            buttonText="Eliminar"
                            confirmText="Sí, eliminar"
                            cancelText="Cancelar"
                            className="px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-sm font-semibold"
                            />

                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay registros para esos filtros.
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
            Total: {filtered.length}
          </div>
        </div>
      </div>
    </main>
  );
}
