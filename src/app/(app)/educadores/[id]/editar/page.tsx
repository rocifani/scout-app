import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import EducadorForm from "@/components/EducadorForm";
import {
  updateEducadorAction,
  setEducadorActivoAction,
} from "./actions";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;

export default async function EditarEducadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const educadorId = Number(id);

  const supabase = await createSupabaseServer();

  const { data: edu, error } = await supabase
    .from("educadores")
    .select(
      "id, nombre, apellido, dni, fecha_nacimiento, domicilio, rama, cargo, email, telefono, activo"
    )
    .eq("id", educadorId)
    .single();

  if (error)
    return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!edu) return <div className="p-6">No encontrado.</div>;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/educadores"
              className="text-sm text-gray-600 hover:underline"
            >
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 mt-2">
              Editar educador
            </h1>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              edu.activo
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {edu.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Form principal */}
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <EducadorForm
            action={updateEducadorAction}
            submitLabel="Guardar cambios"
            ramas={[...RAMAS]}
            defaultValues={{
              id: edu.id,
              nombre: edu.nombre,
              apellido: edu.apellido,
              dni: edu.dni,
              fecha_nacimiento: edu.fecha_nacimiento,
              domicilio: edu.domicilio,
              rama: edu.rama,
              cargo: edu.cargo,
              email: edu.email,
              telefono: edu.telefono,
            }}
          />
        </div>

        {/* Estado */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4">Estado</h2>

          {edu.activo ? (
            <form action={setEducadorActivoAction}>
              <input type="hidden" name="id" value={edu.id} />
              <input type="hidden" name="activo" value="false" />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
              >
                Dar de baja
              </button>
            </form>
          ) : (
            <form action={setEducadorActivoAction}>
              <input type="hidden" name="id" value={edu.id} />
              <input type="hidden" name="activo" value="true" />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100"
              >
                Reactivar
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
