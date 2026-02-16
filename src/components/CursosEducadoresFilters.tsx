"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type EducadorOpt = { id: number; label: string };
type CursoOpt = { id: number; label: string };

type Props = {
  initialQ: string;
  initialEducador: string; // "" | "id"
  initialCurso: string; // "" | "id"
  initialRama: string;

  educadores: EducadorOpt[];
  cursos: CursoOpt[];
  ramas: string[];
};

const controlClass =
  "px-3 py-2 rounded-lg border w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500";

export default function CursosEducadoresFilters({
  initialQ,
  initialEducador,
  initialCurso,
  initialRama,
  educadores,
  cursos,
  ramas,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [educador, setEducador] = useState(initialEducador);
  const [curso, setCurso] = useState(initialCurso);
  const [rama, setRama] = useState(initialRama);

  const hasFilters = useMemo(
    () => !!q.trim() || !!educador || !!curso || !!rama,
    [q, educador, curso, rama]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      params.delete("toast");

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      if (educador) params.set("educador", educador);
      else params.delete("educador");

      if (curso) params.set("curso", curso);
      else params.delete("curso");

      if (rama) params.set("rama", rama);
      else params.delete("rama");

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, educador, curso, rama]);

  function limpiar() {
    setQ("");
    setEducador("");
    setCurso("");
    setRama("");
  }

  return (
    <div className="mb-6">
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por educador o curso..."
            className={`${controlClass} lg:w-80`}
          />

          <select
            value={educador}
            onChange={(e) => setEducador(e.target.value)}
            className={`${controlClass} lg:w-72`}
          >
            <option value="">Todos los educadores</option>
            {educadores.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.label}
              </option>
            ))}
          </select>

          <select
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className={`${controlClass} lg:w-72`}
          >
            <option value="">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={rama}
            onChange={(e) => setRama(e.target.value)}
            className={`${controlClass} lg:w-64`}
          >
            <option value="">Todas las ramas</option>
            {ramas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={limpiar}
              className={
                "px-4 py-2 rounded-lg border font-semibold " +
                "border-gray-300 hover:bg-gray-50 text-gray-900 " +
                "dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-100"
              }
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
