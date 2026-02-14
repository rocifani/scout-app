import Link from "next/link";

type Props = {
  title: string;
  submitLabel: string;
  defaultValues?: {
    nombre?: string;
    apellido?: string;
    rama?: string;
    fecha_nacimiento?: string;
    domicilio?: string;
    dni?: number;
  };
  ramas?: string[];
};

export default function ProtagonistaForm({
  title,
  submitLabel,
  defaultValues,
  ramas = ["Manada", "Unidad", "Caminantes", "Rovers"],
}: Props) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
        {title}
      </h1>

      {/* OJO: este componente ya NO crea el <form>. */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Nombre
            </label>
            <input
              name="nombre"
              defaultValue={defaultValues?.nombre ?? ""}
              className="w-full px-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Apellido
            </label>
            <input
              name="apellido"
              defaultValue={defaultValues?.apellido ?? ""}
              className="w-full px-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Rama
            </label>
            <select
              name="rama"
              defaultValue={defaultValues?.rama ?? ""}
              className="w-full px-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            >
              <option value="" disabled>
                Seleccioná una rama
              </option>
              {ramas.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              defaultValue={defaultValues?.fecha_nacimiento ?? ""}
              className="w-full px-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Domicilio
            </label>
            <input
              name="domicilio"
              defaultValue={defaultValues?.domicilio ?? ""}
              className="w-full px-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              DNI
            </label>
            <input
              name="dni"
              inputMode="numeric"
              defaultValue={defaultValues?.dni?.toString() ?? ""}
              className="w-full px-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            {submitLabel}
          </button>

          <Link
            href="/protagonistas"
            className="px-4 py-2 text-sm font-medium rounded-lg
                       border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-200
                       hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
