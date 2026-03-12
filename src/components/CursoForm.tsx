"use client";

import Link from "next/link";
import SubmitButton from "./SubmitButton";

type Props = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    nombre_curso?: string;
  };
};

export default function CursoForm({ title, submitLabel, action, defaultValues }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h2>

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
          <input
            name="nombre_curso"
            defaultValue={defaultValues?.nombre_curso ?? ""}
            placeholder="Ej: Curso de Primeros Auxilios"
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/cursos" className="px-4 py-2 rounded-lg border">
            Cancelar
          </Link>

          <SubmitButton
  idleText={submitLabel}
  loadingText="Guardando..."
  className="text-sm bg-[#FCDB52] text-gray-900 hover:bg-[#F3D146] active:bg-[#E9C83D] focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
/>
        </div>
      </form>
    </div>
  );
}
