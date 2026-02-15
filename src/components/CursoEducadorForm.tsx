import Link from "next/link";

type EducadorOpt = { id: number; label: string };
type CursoOpt = { id: number; label: string };

type Props = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  educadores: EducadorOpt[];
  cursos: CursoOpt[];
  ramas: string[];
  defaultValues?: {
    id?: number;
    id_educador?: number;
    id_curso?: number;
    rama?: string | null;
  };
  cancelHref?: string;
};

export default function CursoEducadorForm({
  title,
  submitLabel,
  action,
  educadores,
  cursos,
  ramas,
  defaultValues,
  cancelHref = "/admin/cursos-educadores",
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h2>

      <form action={action} className="grid grid-cols-1 gap-4">
        {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Educador</label>
          <select
            name="id_educador"
            defaultValue={defaultValues?.id_educador ? String(defaultValues.id_educador) : ""}
            className="w-full rounded-lg border px-3 py-2 bg-white"
            required
          >
            <option value="">Seleccionar educador...</option>
            {educadores.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Curso</label>
          <select
            name="id_curso"
            defaultValue={defaultValues?.id_curso ? String(defaultValues.id_curso) : ""}
            className="w-full rounded-lg border px-3 py-2 bg-white"
            required
          >
            <option value="">Seleccionar curso...</option>
            {cursos.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">
            Rama (opcional)
          </label>
          <select
            name="rama"
            defaultValue={defaultValues?.rama ?? ""}
            className="w-full rounded-lg border px-3 py-2 bg-white"
          >
            <option value="">(Sin especificar)</option>
            {ramas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Usalo cuando el curso fue realizado en una rama distinta a la actual.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2">
          <Link href={cancelHref} className="px-4 py-2 rounded-lg border">
            Cancelar
          </Link>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#FCDB52] text-gray-900 font-semibold">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
