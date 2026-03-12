import Link from "next/link";
import { createCarpaAction } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default function NuevaCarpaPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Nueva carpa</h1>

          <Link
            href="/admin/carpas"
            className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Volver
          </Link>
        </div>

        <form action={createCarpaAction} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="grid gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Número de carpa
              </label>
              <input
                name="numero_carpa"
                type="number"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="Ej: 12"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="Estado, accesorios, notas..."
              />
            </div>

            {/* Si después querés volver a habilitar esto, ya está soportado en la action */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                URL de foto
              </label>
              <input
                name="url_foto"
                type="url"
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <SubmitButton
                idleText="Guardar"
                loadingText="Guardando..."
                className="text-sm bg-[#FCDB52] text-gray-900 hover:bg-[#F3D146] active:bg-[#E9C83D] focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
              />

              <Link
                href="/admin/carpas"
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700
                           text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
