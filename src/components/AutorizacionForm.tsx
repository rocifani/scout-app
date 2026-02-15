"use client";

import Link from "next/link";

type Props = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    id?: number;
    nombre_autorizacion?: string;
  };
};

export default function AutorizacionForm({ title, submitLabel, action, defaultValues }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h2>

      <form action={action} className="space-y-4">
        {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
          <input
            name="nombre_autorizacion"
            defaultValue={defaultValues?.nombre_autorizacion ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Ej: Autorización salida, Ficha médica, etc."
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/autorizaciones" className="px-4 py-2 rounded-lg border">
            Cancelar
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
