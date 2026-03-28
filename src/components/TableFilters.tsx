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
  showActivoFilter?: boolean;
};

const baseControl =
  "px-3 py-1 rounded-lg border w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500";

const SCROLL_KEY = "table-scroll-y";

export default function TableFilters({
  ramas,
  initialQ = "",
  initialRama = "",
  initialActivo = "",
  placeholder = "Buscar por nombre o apellido...",
  includeToastParam = false,
  showActivoFilter = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [rama, setRama] = useState(initialRama);
  const [activo, setActivo] = useState(showActivoFilter ? initialActivo : "");

  const hasFilters = useMemo(
    () => !!q || !!rama || (showActivoFilter && !!activo),
    [q, rama, activo, showActivoFilter]
  );

  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setRama(sp.get("rama") ?? "");
    setActivo(showActivoFilter ? sp.get("activo") ?? "" : "");
  }, [sp, showActivoFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (!includeToastParam) params.delete("toast");

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      if (rama) params.set("rama", rama);
      else params.delete("rama");

      if (showActivoFilter && activo) params.set("activo", activo);
      else params.delete("activo");

      const qs = params.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      const currentUrl = sp.toString() ? `${pathname}?${sp.toString()}` : pathname;

      if (nextUrl !== currentUrl) {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        router.replace(nextUrl, { scroll: false });
      }
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, rama, activo, showActivoFilter]);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;

    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(saved), behavior: "auto" });
      sessionStorage.removeItem(SCROLL_KEY);
    });
  }, [sp]);

  function limpiar() {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
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

        {showActivoFilter && (
          <select
            value={activo}
            onChange={(e) => setActivo(e.target.value)}
            className={`${baseControl} sm:w-56`}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        )}

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