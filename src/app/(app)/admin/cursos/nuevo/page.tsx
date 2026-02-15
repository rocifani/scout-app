import Link from "next/link";
import CursoForm from "@/components/CursoForm";
import { createCursoAction } from "./actions";

export default function NuevoCursoPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/cursos" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
            Nuevo curso
          </h1>
        </div>

        <CursoForm title="Datos del curso" submitLabel="Crear curso" action={createCursoAction} />
      </div>
    </main>
  );
}
