"use client";

import { useState } from "react";

const RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"] as const;
const RELACIONES = ["Papá", "Mamá", "Tutor"] as const;

type Rama = (typeof RAMAS)[number];
type Relacion = (typeof RELACIONES)[number];

type PadreInput = {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  relacion: Relacion;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
};

export default function ProtagonistaCreateForm({ action }: Props) {
  const [padres, setPadres] = useState<PadreInput[]>([
    { nombre: "", apellido: "", dni: "", telefono: "", email: "", relacion: "Papá" },
  ]);

  const addPadre = () =>
    setPadres((prev) => [
      ...prev,
      { nombre: "", apellido: "", dni: "", telefono: "", email: "", relacion: "Papá" },
    ]);

  const removePadre = (idx: number) => setPadres((prev) => prev.filter((_, i) => i !== idx));

  const updatePadre = <K extends keyof PadreInput>(idx: number, key: K, value: PadreInput[K]) =>
    setPadres((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));

  return (
    <form
      action={(fd) => {
        fd.set("padres_json", JSON.stringify(padres));
        return action(fd);
      }}
      className="grid grid-cols-1 gap-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <select
            name="rama"
            className="w-full rounded-lg border px-3 py-2 bg-white"
            required
            defaultValue={RAMAS[0] as Rama}
          >
            {RAMAS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold">Padres / Tutores</h2>
          <button type="button" onClick={addPadre} className="px-3 py-2 rounded-lg text-sm border hover:bg-gray-50">
            + Agregar
          </button>
        </div>

        <div className="space-y-4">
          {padres.map((p, idx) => (
            <div key={idx} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Padre/Tutor {idx + 1}</p>
                {padres.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePadre(idx)}
                    className="text-sm px-2 py-1 rounded-lg text-red-700 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Nombre</label>
                  <input
                    value={p.nombre}
                    onChange={(e) => updatePadre(idx, "nombre", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Apellido</label>
                  <input
                    value={p.apellido}
                    onChange={(e) => updatePadre(idx, "apellido", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">DNI</label>
                  <input
                    value={p.dni}
                    onChange={(e) => updatePadre(idx, "dni", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Teléfono</label>
                  <input
                    value={p.telefono}
                    onChange={(e) => updatePadre(idx, "telefono", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={p.email}
                    onChange={(e) => updatePadre(idx, "email", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">Relación</label>
                  <select
                    value={p.relacion}
                    onChange={(e) => updatePadre(idx, "relacion", e.target.value as Relacion)}
                    className="w-full rounded-lg border px-3 py-2 bg-white"
                    required
                  >
                    {RELACIONES.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <a href="/protagonistas" className="px-4 py-2 rounded-lg border">
          Cancelar
        </a>
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold">
          Crear
        </button>
      </div>
    </form>
  );
}
