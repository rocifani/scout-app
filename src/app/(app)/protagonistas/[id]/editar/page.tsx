import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setProtagonistaActivo, updateProtagonista } from "./actions";

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
  padres_protagonistas: PadreProtagonista[];
};

function formatARDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("es-AR");
}

export default async function EditarProtagonistaPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("protagonistas")
    .select(
      `
      id, nombre, apellido, rama, fecha_nacimiento, activo, domicilio, dni,
      padres_protagonistas (
        id,
        relacion,
        padres ( id, nombre, apellido, telefono, email, dni )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!data) return <div className="p-6">No encontrado.</div>;

  const p = data as unknown as ProtagonistaDetalle;

  const padresOrdenados =
    (p.padres_protagonistas ?? [])
      .filter((x) => x.padres)
      .sort((a, b) => (a.relacion ?? "").localeCompare(b.relacion ?? ""));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/protagonistas"
              className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              Editar protagonista
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {p.apellido}, {p.nombre} · Nac: {formatARDate(p.fecha_nacimiento)}
            </p>
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

        {/* CARD: Datos del protagonista */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Datos del protagonista
          </h2>

          <form
            action={async (formData) => {
              "use server";

              const payload = {
                id: p.id,
                nombre: String(formData.get("nombre") ?? ""),
                apellido: String(formData.get("apellido") ?? ""),
                rama: String(formData.get("rama") ?? ""),
                fecha_nacimiento: String(formData.get("fecha_nacimiento") ?? ""),
                domicilio: String(formData.get("domicilio") ?? ""),
                dni: Number(formData.get("dni") ?? 0),
              };

              await updateProtagonista(payload);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
              <input
                name="nombre"
                defaultValue={p.nombre}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Apellido</label>
              <input
                name="apellido"
                defaultValue={p.apellido}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Rama</label>
              <input
                name="rama"
                defaultValue={p.rama}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
              {/* Si rama es enum real, después lo cambiamos por <select> */}
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                defaultValue={p.fecha_nacimiento}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">DNI</label>
              <input
                type="number"
                name="dni"
                defaultValue={p.dni}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Domicilio</label>
              <input
                name="domicilio"
                defaultValue={p.domicilio}
                className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-2">
              <Link
                href="/protagonistas"
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                           text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold
                           hover:bg-[#F3D146] active:bg-[#E9C83D]
                           focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

        {/* CARD: Padres / Tutores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Padres / Tutores
            </h2>

            {/* Placeholder: después armamos pantalla/flow para agregar */}
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled
              title="Después armamos alta/relación de padres"
            >
              Agregar
            </button>
          </div>

          {padresOrdenados.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No hay padres/tutores vinculados todavía.
            </p>
          ) : (
            <div className="space-y-3">
              {padresOrdenados.map((pp) => (
                <div
                  key={pp.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {pp.padres!.apellido}, {pp.padres!.nombre}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Relación: {pp.relacion ?? "—"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        DNI: {pp.padres!.dni}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Tel: {pp.padres!.telefono}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Email: {pp.padres!.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD: Acciones peligrosas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Estado
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {p.activo
              ? "Este protagonista está activo. Podés darlo de baja si ya no participa."
              : "Este protagonista está inactivo. Podés reactivarlo si vuelve a participar."}
          </p>

          {p.activo ? (
            <form
              action={async () => {
                "use server";
                await setProtagonistaActivo(p.id, false);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100
                           dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Dar de baja
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await setProtagonistaActivo(p.id, true);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100
                           dark:bg-gray-700 dark:hover:bg-gray-600"
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
