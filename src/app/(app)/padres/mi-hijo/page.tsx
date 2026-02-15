import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type Protagonista = {
  id: number;
  created_at: string;
  nombre: string;
  apellido: string;
  rama: string;
  fecha_nacimiento: string; // "YYYY-MM-DD"
  activo: boolean;
  domicilio: string;
  dni: number;
};

function formatARDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("es-AR");
}

function EstadoPill({ activo }: { activo: boolean }) {
  const base = "px-2 py-1 font-semibold leading-tight rounded-full";
  return activo ? (
    <span className={`${base} text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100`}>
      Activo
    </span>
  ) : (
    <span className={`${base} text-gray-700 bg-gray-100 dark:text-gray-100 dark:bg-gray-700`}>
      Inactivo
    </span>
  );
}

export default async function MiHijoPage() {
  const supabase = await createSupabaseServer();

  // 1) Usuario logueado
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    return <div className="p-6 text-red-600">Error auth: {userErr.message}</div>;
  }
  if (!user) redirect("/login");

  // 2) Buscar el padre por auth_user_id
  const { data: padre, error: padreErr } = await supabase
    .from("padres")
    .select("id, nombre, apellido, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (padreErr) return <div className="p-6 text-red-600">Error: {padreErr.message}</div>;

  // Si el usuario existe pero todavía no está vinculado como padre
  if (!padre) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>

          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Perfil de mi hijo/a</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Tu usuario está logueado, pero todavía no está vinculado a un padre/tutor en el sistema.
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Pedile a un educador/admin que cargue tu DNI + email en “Padres” para vincular tu cuenta.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3) Traer protagonistas relacionados con este padre (join)
  const { data, error } = await supabase
    .from("padres_protagonistas")
    .select(
      `
      id_protagonista,
      relacion,
      protagonistas:protagonistas (
        id, created_at, nombre, apellido, rama, fecha_nacimiento, activo, domicilio, dni
      )
    `
    )
    .eq("id_padre", padre.id);

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const rows: Array<{ relacion: string; protagonista: Protagonista }> = (data ?? [])
    .map((r: any) => ({
      relacion: r.relacion ?? "Padre/Madre",
      protagonista: r.protagonistas as Protagonista,
    }))
    .filter((x) => !!x.protagonista)
    .sort((a, b) => {
      const ap = (a.protagonista.apellido || "").localeCompare(b.protagonista.apellido || "");
      if (ap !== 0) return ap;
      return (a.protagonista.nombre || "").localeCompare(b.protagonista.nombre || "");
    });

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Volver
            </Link>

            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-2">
              Perfil de mi hijo/a
            </h1>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {padre.apellido}, {padre.nombre} · {padre.email}
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Hijo/a</th>
                  <th className="px-4 py-3">Rama</th>
                  <th className="px-4 py-3 hidden md:table-cell">DNI</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Dirección</th>
                  <th className="px-4 py-3 hidden md:table-cell">Estado</th>
                  <th className="px-4 py-3">Relación</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map(({ protagonista: p, relacion }) => (
                  <tr key={p.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-semibold">
                          {p.apellido}, {p.nombre}
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Fecha nacimiento: {formatARDate(p.fecha_nacimiento)}
                        </p>

                        <div className="mt-2 md:hidden">
                          <EstadoPill activo={p.activo} />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm">{p.rama}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{p.dni}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{p.domicilio}</td>

                    <td className="px-4 py-3 text-xs hidden md:table-cell">
                      <EstadoPill activo={p.activo} />
                    </td>

                    <td className="px-4 py-3 text-sm">{relacion}</td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No tenés protagonistas vinculados todavía.
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
            Total: {rows.length}
          </div>
        </div>
      </div>
    </main>
  );
}
