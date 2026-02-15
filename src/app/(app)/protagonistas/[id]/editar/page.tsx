import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setProtagonistaActivoAction, updateProtagonistaAction, updatePadreYRelacionAction } from "./actions";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;

type Padre = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: number;
  email: string;
  dni: number;
};

type PadreProtagonista = {
  id: number;
  relacion: string | null;
  padres: Padre | null;
};

type ProtagonistaDetalle = {
  id: number;
  nombre: string;
  apellido: string;
  rama: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  activo: boolean;
  domicilio: string;
  dni: number;
};

function formatARDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("es-AR");
}

export default async function EditarProtagonistaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const protagonistaId = Number(id);

  const supabase = await createSupabaseServer();

  // 1) Traer protagonista (solo)
  const { data: p, error: pErr } = await supabase
    .from("protagonistas")
    .select("id, nombre, apellido, rama, fecha_nacimiento, activo, domicilio, dni")
    .eq("id", protagonistaId)
    .single();

  if (pErr) return <div className="p-6 text-red-600">Error protagonista: {pErr.message}</div>;
  if (!p) return <div className="p-6">No encontrado.</div>;

  // 2) Traer padres vinculados (robusto)
  const { data: rels, error: relErr } = await supabase
    .from("padres_protagonistas")
    .select(
      `
      id,
      relacion,
      padres:padres!padres_protagonistas_id_padre_fkey (
        id, nombre, apellido, telefono, email, dni
      )
    `
    )
    .eq("id_protagonista", protagonistaId);

  // Si acá hay error -> es RLS o permisos
  if (relErr) {
    return (
      <div className="p-6 text-red-600">
        Error padres_protagonistas: {relErr.message}
        <div className="mt-2 text-sm text-gray-600">
          (Esto normalmente es RLS. Si querés, te paso la policy mínima para lectura.)
        </div>
      </div>
    );
  }

  const padresOrdenados =
    (rels as unknown as PadreProtagonista[] | null ?? [])
      .filter((x) => x.padres)
      .sort((a, b) => (a.relacion ?? "").localeCompare(b.relacion ?? ""));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/protagonistas" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              Editar protagonista
            </h1>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              p.activo
                ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
            }`}
          >
            {p.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Datos protagonista */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Datos del protagonista
          </h2>

          <form action={updateProtagonistaAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={p.id} />

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
              <input name="nombre" defaultValue={p.nombre} className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Apellido</label>
              <input name="apellido" defaultValue={p.apellido} className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Rama</label>
              <select name="rama" defaultValue={p.rama} className="w-full rounded-lg border px-3 py-2 bg-white" required>
                {RAMAS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Fecha de nacimiento</label>
              <input type="date" name="fecha_nacimiento" defaultValue={p.fecha_nacimiento} className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">DNI</label>
              <input type="number" name="dni" defaultValue={p.dni} className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Domicilio</label>
              <input name="domicilio" defaultValue={p.domicilio} className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-2">
              <Link href="/protagonistas" className="px-4 py-2 rounded-lg border">
                Cancelar
              </Link>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

       {/* Padres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Padres / Tutores</h2>
          </div>

          {padresOrdenados.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No hay padres/tutores vinculados todavía.
            </p>
          ) : (
            <div className="space-y-3">
              {padresOrdenados.map((pp) => (
                <div key={pp.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {pp.padres!.apellido}, {pp.padres!.nombre}
                      </p>
                    </div>

                    {/* Form editar padre + relación */}
                    <form action={updatePadreYRelacionAction} className="w-full max-w-md">
                      <input type="hidden" name="id_protagonista" value={p.id} />
                      <input type="hidden" name="id_padre" value={pp.padres!.id} />
                      <input type="hidden" name="id_padre_protagonista" value={pp.id} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                          <input
                            name="nombre"
                            defaultValue={pp.padres!.nombre}
                            className="w-full rounded-lg border px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Apellido</label>
                          <input
                            name="apellido"
                            defaultValue={pp.padres!.apellido}
                            className="w-full rounded-lg border px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Relación</label>
                        <select
                          name="relacion"
                          defaultValue={pp.relacion ?? ""}
                          className="w-full rounded-lg border px-3 py-2 bg-white"
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="Mamá">Mamá</option>
                          <option value="Papá">Papá</option>
                          <option value="Tutor">Tutor</option>
                        </select>

                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">DNI</label>
                          <input
                            type="number"
                            name="dni"
                            defaultValue={pp.padres!.dni}
                            className="w-full rounded-lg border px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
                          <input
                            type="number"
                            name="telefono"
                            defaultValue={pp.padres!.telefono}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Email</label>
                          <input
                            type="email"
                            name="email"
                            defaultValue={pp.padres!.email}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          className="px-3 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold text-sm"
                        >
                          Guardar padre
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Estado</h2>

          {p.activo ? (
            <form action={setProtagonistaActivoAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="activo" value="false" />
              <button type="submit" className="px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100">
                Dar de baja
              </button>
            </form>
          ) : (
            <form action={setProtagonistaActivoAction}>
              <input type="hidden" name="id" value={p.id} />
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
