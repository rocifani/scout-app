import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import CursoEducadorForm from "@/components/CursoEducadorForm";
import { updateCursoEducadorAction } from "../../actions";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;

export default async function EditarCursoEducadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rowId = Number(id);

  const supabase = await createSupabaseServer();

  const { data: row, error: rowErr } = await supabase
    .from("cursos_educadores")
    .select("id,id_educador,id_curso,rama")
    .eq("id", rowId)
    .single();

  if (rowErr) return <div className="p-6 text-red-600">Error: {rowErr.message}</div>;
  if (!row) return <div className="p-6">No encontrado.</div>;

  const { data: educadores } = await supabase
    .from("educadores")
    .select("id,nombre,apellido,activo")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id,nombre_curso,sistema_actual")
    .order("nombre_curso", { ascending: true });

  const educadoresOpts = (educadores ?? []).map((e) => ({
    id: e.id as number,
    label: `${e.apellido}, ${e.nombre}${e.activo ? "" : " (Inactivo)"}`,
  }));

  const cursosOpts = (cursos ?? []).map((c) => ({
    id: c.id as number,
    label: `${c.nombre_curso}${c.sistema_actual ? "" : " (Inactivo)"}`,
  }));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/cursos-educadores" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 mt-2">Editar curso realizado</h1>
        </div>

        <CursoEducadorForm
          title="Datos del curso realizado"
          submitLabel="Guardar cambios"
          action={updateCursoEducadorAction}
          educadores={educadoresOpts}
          cursos={cursosOpts}
          ramas={[...RAMAS]}
          defaultValues={{
            id: row.id,
            id_educador: row.id_educador ?? undefined,
            id_curso: row.id_curso ?? undefined,
            rama: row.rama ?? "",
          }}
        />
      </div>
    </main>
  );
}
