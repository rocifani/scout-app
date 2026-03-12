"use client";

import SubmitButton from "./SubmitButton";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  defaultValues?: Partial<{
    id: number;
    nombre: string;
    apellido: string;
    dni: number;
    fecha_nacimiento: string; // YYYY-MM-DD
    domicilio: string;
    rama: string;
    cargo: string;
    email: string;
    telefono: number;
    activo: boolean;
  }>;
  ramas?: string[];
};

const DEFAULT_RAMAS = ["Lobatos y Lobeznas", "Scout", "Caminantes", "Rover"];

export default function EducadorForm({
  action,
  submitLabel,
  defaultValues,
  ramas = DEFAULT_RAMAS,
}: Props) {
  const isEdit = !!defaultValues?.id;
  const showActivo = typeof defaultValues?.activo === "boolean";

  return (
    <form action={action} className="space-y-4">
      {/* ✅ para update */}
      {isEdit ? <input type="hidden" name="id" value={defaultValues!.id} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            name="nombre"
            defaultValue={defaultValues?.nombre ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Apellido</label>
          <input
            name="apellido"
            defaultValue={defaultValues?.apellido ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">DNI</label>
          <input
            name="dni"
            type="number"
            defaultValue={defaultValues?.dni ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Fecha nacimiento</label>
          <input
            name="fecha_nacimiento"
            type="date"
            defaultValue={defaultValues?.fecha_nacimiento ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Domicilio</label>
          <input
            name="domicilio"
            defaultValue={defaultValues?.domicilio ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Rama</label>
          <select
            name="rama"
            defaultValue={defaultValues?.rama ?? ""}
            className="w-full rounded-lg border px-3 py-2 bg-white"
            required
          >
            <option value="" disabled>
              Seleccionar…
            </option>
            {ramas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Cargo</label>
          <input
            name="cargo"
            defaultValue={defaultValues?.cargo ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input
            name="telefono"
            type="number"
            defaultValue={defaultValues?.telefono ?? ""}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        {/* ✅ solo en editar (si pasás activo en defaultValues) */}
        {showActivo && (
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={!!defaultValues?.activo}
                className="rounded border"
              />
              Activo
            </label>
          </div>
        )}
      </div>

     <div className="flex justify-end">
  <SubmitButton
    idleText={submitLabel}
    loadingText={isEdit ? "Guardando..." : "Creando..."}
    className="text-sm bg-[#FCDB52] text-gray-900 hover:bg-[#F3D146] active:bg-[#E9C83D] focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
  />
</div>

      {!isEdit && (
        <p className="text-xs text-gray-500">
          Se creará un usuario para acceder a la app con el mail proporcionado y contraseña: <b>nombreapellidoañonacimiento</b> (sin acentos y todo en minúscula). Ej:{" "}
          <b>rociofani2002</b>.
        </p>
      )}
    </form>
  );
}
