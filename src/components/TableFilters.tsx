"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  ramas: string[];
  initialQ?: string;
  initialRama?: string;
  initialActivo?: string; // "", "true", "false"
  placeholder?: string;
  includeToastParam?: boolean;
};

const baseControl =
  "px-3 py-1 rounded-lg border w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500";

export default function TableFilters({
  ramas,
  initialQ = "",
  initialRama = "",
  initialActivo = "",
  placeholder = "Buscar por nombre o apellido...",
  includeToastParam = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [rama, setRama] = useState(initialRama);
  const [activo, setActivo] = useState(initialActivo);

  const hasFilters = useMemo(() => !!q || !!rama || !!activo, [q, rama, activo]);

  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setRama(sp.get("rama") ?? "");
    setActivo(sp.get("activo") ?? "");
  }, [sp]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (!includeToastParam) params.delete("toast");

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      if (rama) params.set("rama", rama);
      else params.delete("rama");

      if (activo) params.set("activo", activo);
      else params.delete("activo");

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, rama, activo]);

  function limpiar() {
    setQ("");
    setRama("");
    setActivo("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className={`${baseControl} sm:w-72`}
        />

        <select
          value={rama}
          onChange={(e) => setRama(e.target.value)}
          className={`${baseControl} sm:w-64`}
        >
          <option value="">Todas las ramas</option>
          {ramas.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={activo}
          onChange={(e) => setActivo(e.target.value)}
          className={`${baseControl} sm:w-56`}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={limpiar}
            className={
              "px-3 py-1 rounded-lg border text-sm " +
              "border-gray-300 hover:bg-gray-50 " +
              "dark:border-gray-700 dark:hover:bg-gray-800/70 dark:text-gray-100"
            }
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
