import Link from "next/link";
import AutorizacionForm from "@/components/AutorizacionForm";
import { createAutorizacionAction } from "./actions";

export default function NuevaAutorizacionPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/autorizaciones" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
            Nueva autorización
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <AutorizacionForm title="Datos de la autorización" submitLabel="Crear" action={createAutorizacionAction} />
        </div>
      </div>
    </main>
  );
}
