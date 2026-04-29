import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import CampamentoForm from "@/components/CampamentoForm";
import { updateCampamentoAction, deleteCampamentoAction } from "./actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditarCampamentoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("campamentos")
    .select("id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, lugar, costo")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const updateAction = updateCampamentoAction.bind(null, id);
  const deleteAction = deleteCampamentoAction.bind(null, id);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/campamentos" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
            Editar campamento
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <CampamentoForm
            title="Datos del campamento"
            submitLabel="Guardar cambios"
            action={updateAction}
            defaultValues={{
              fecha_inicio: data.fecha_inicio,
              fecha_fin:    data.fecha_fin,
              hora_inicio:  data.hora_inicio,
              hora_fin:     data.hora_fin,
              lugar:        data.lugar,
              costo:        data.costo,
            }}
          />
        </div>

        {/* Zona de peligro */}
        <div className="mt-8 border border-red-200 dark:border-red-800 rounded-xl p-5">
          
          <form action={deleteAction}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg
                         bg-red-600 text-white
                         hover:bg-red-700 active:bg-red-800
                         focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              Eliminar campamento
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}