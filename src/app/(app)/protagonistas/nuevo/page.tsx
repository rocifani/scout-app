import Link from "next/link";
import ProtagonistaCreateForm from "@/components/ProtagonistaCreateForm";
import { createProtagonistaConPadres } from "./actions";

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
          <ProtagonistaCreateForm action={createProtagonistaConPadres} />
        </div>
      </div>
    </main>
  );
}
