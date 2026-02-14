"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  ramas: string[];
  initialQ: string;
  initialRama: string;
  initialActivo: string; // "", "true", "false"
};

export default function ProtagonistasFilters({ ramas, initialQ, initialRama, initialActivo }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [rama, setRama] = useState(initialRama);
  const [activo, setActivo] = useState(initialActivo);

  const hasFilters = useMemo(() => !!q || !!rama || !!activo, [q, rama, activo]);

  // ✅ auto-búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());

      // mantenemos el toast si existe? mejor NO, así no queda pegado
      params.delete("toast");

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

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o apellido..."
          className="px-3 py-1 rounded-lg border w-full sm:w-72"
        />

        <select
          value={rama}
          onChange={(e) => setRama(e.target.value)}
          className="px-3 py-1 rounded-lg border w-full sm:w-64 bg-white"
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
          className="px-3 py-1 rounded-lg border w-full sm:w-56 bg-white"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>

       
      </div>

    </div>
  );
}
