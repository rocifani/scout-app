"use client";

import { useRef, useState, useTransition } from "react";

type Props = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    hora_inicio?: string;
    hora_fin?: string;
    lugar?: string;
    costo?: number;
  };
};

export default function CampamentoForm({ title, submitLabel, action, defaultValues = {} }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 " +
    "px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/60";

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">{title}</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha_inicio" className={labelClass}>Fecha inicio</label>
          <input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            required
            defaultValue={defaultValues.fecha_inicio ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="fecha_fin" className={labelClass}>Fecha fin</label>
          <input
            id="fecha_fin"
            name="fecha_fin"
            type="date"
            required
            defaultValue={defaultValues.fecha_fin ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="hora_inicio" className={labelClass}>Hora inicio</label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            required
            defaultValue={defaultValues.hora_inicio ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="hora_fin" className={labelClass}>Hora fin</label>
          <input
            id="hora_fin"
            name="hora_fin"
            type="time"
            required
            defaultValue={defaultValues.hora_fin ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="lugar" className={labelClass}>Lugar</label>
        <input
          id="lugar"
          name="lugar"
          type="text"
          required
          placeholder="Ej: Camping Los Pinos, Córdoba"
          defaultValue={defaultValues.lugar ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="costo" className={labelClass}>Costo ($)</label>
        <input
          id="costo"
          name="costo"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="0.00"
          defaultValue={defaultValues.costo ?? ""}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto px-5 py-2 text-sm font-semibold rounded-lg
                   bg-[#FCDB52] text-gray-900
                   hover:bg-[#F3D146] active:bg-[#E9C83D]
                   focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}