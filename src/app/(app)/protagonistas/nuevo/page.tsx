import Link from "next/link";
import { createProtagonista } from "./actions";

export default function NuevoProtagonistaPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/protagonistas" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 mt-2">Nuevo protagonista</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <form action={createProtagonista} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <input name="nombre" className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Apellido</label>
              <input name="apellido" className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Rama</label>
              <input name="rama" className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Fecha nacimiento</label>
              <input type="date" name="fecha_nacimiento" className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm mb-1">DNI</label>
              <input type="number" name="dni" className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Domicilio</label>
              <input name="domicilio" className="w-full rounded-lg border px-3 py-2" required />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <Link href="/protagonistas" className="px-4 py-2 rounded-lg border">
                Cancelar
              </Link>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
