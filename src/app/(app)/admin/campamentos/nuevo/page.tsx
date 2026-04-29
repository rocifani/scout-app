import Link from "next/link";
import CampamentoForm from "@/components/CampamentoForm";
import { createCampamentoAction } from "./actions";

export default function NuevoCampamentoPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/campamentos" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
            Nuevo campamento
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <CampamentoForm
            title="Datos del campamento"
            submitLabel="Crear"
            action={createCampamentoAction}
          />
        </div>
      </div>
    </main>
  );
}