"use client";

import { useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

export default function ValorFormConfirm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [tipo, setTipo] = useState<"cuota" | "afiliacion">("cuota");
  const [valor, setValor] = useState("");
  const [open, setOpen] = useState(false);

  const [formDataRef, setFormDataRef] = useState<FormData | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFormDataRef(fd);
    setOpen(true);
  }

  function confirm() {
    if (formDataRef) action(formDataRef);
    setOpen(false);
  }

  const pretty = Number(valor || 0).toLocaleString("es-AR");

  return (
    <>
      <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-4 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select
              name="tipo"
              className="w-full rounded-lg border px-3 py-2"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
            >
              <option value="cuota">Cuota</option>
              <option value="afiliacion">Afiliación</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Nuevo valor ($)</label>
            <input
              name="valor"
              type="number"
              required
              className="w-full rounded-lg border px-3 py-2"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            Guardar nuevo valor
          </button>
        </div>
      </form>

      <ConfirmModal
        open={open}
        title="Confirmar actualización"
        description={
          <>
            <p>Vas a cargar un nuevo valor:</p>
            <p className="mt-2 font-semibold">
              {tipo === "cuota" ? "Cuota" : "Afiliación"} — ${pretty}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Esto actualizará automáticamente las cuotas futuras impagas.
            </p>
          </>
        }
        confirmText="Sí, guardar"
        cancelText="Cancelar"
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
