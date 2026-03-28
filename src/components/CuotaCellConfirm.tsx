"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

type CuotaRow = {
  id: number;
  periodo: string;
  tipo_pago: "cuota" | "afiliacion";
  fecha_pago: string | null;
  cuota_valor?: { valor: number } | null;
};

const SCROLL_KEY = "table-scroll-y";

function estadoCuotaClass(pagado: boolean) {
  return pagado
    ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
    : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100";
}

export default function CuotaCellConfirm({
  cuota,
  pagarAction,
  impagarAction,
}: {
  cuota?: CuotaRow;
  pagarAction: (formData: FormData) => Promise<void>;
  impagarAction: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pagarFormRef = useRef<HTMLFormElement | null>(null);
  const impagarFormRef = useRef<HTMLFormElement | null>(null);

  const returnTo = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;

    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(saved), behavior: "auto" });
      sessionStorage.removeItem(SCROLL_KEY);
    });
  }, []);

  if (!cuota) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  }

  const valor = cuota.cuota_valor?.valor ?? null;
  const pagado = !!cuota.fecha_pago;

  const labelPeriodo = useMemo(() => {
    if (cuota.tipo_pago === "afiliacion") return "Afiliación";

    const d = new Date(`${cuota.periodo}T00:00:00`);

    const raw = d.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
    const normalized = raw.replace(/\s+de\s+/g, " ");
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [cuota.periodo, cuota.tipo_pago]);

  const prettyValor =
    valor !== null ? `$${Number(valor).toLocaleString("es-AR")}` : "$—";

  function abrirConfirmacion() {
    setOpen(true);
  }

  function confirmar() {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    setOpen(false);

    if (pagado) {
      impagarFormRef.current?.requestSubmit();
    } else {
      pagarFormRef.current?.requestSubmit();
    }
  }

  return (
    <div className="space-y-2 min-w-40">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">{prettyValor}</div>
        <span className={estadoCuotaClass(pagado)}>
          {pagado ? "Pagado" : "Impago"}
        </span>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {pagado
          ? `Fecha: ${new Date(cuota.fecha_pago!).toLocaleDateString("es-AR")}`
          : "—"}
      </div>

      <button
        type="button"
        onClick={abrirConfirmacion}
        className="px-3 py-2 rounded-lg text-xs font-semibold
                   border border-gray-200 text-gray-700 hover:bg-gray-100
                   dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700
                   focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
      >
        {pagado ? "Marcar impaga" : "Pagar"}
      </button>

      <form ref={pagarFormRef} action={pagarAction} className="hidden">
        <input type="hidden" name="cuota_id" value={cuota.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
      </form>

      <form ref={impagarFormRef} action={impagarAction} className="hidden">
        <input type="hidden" name="cuota_id" value={cuota.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
      </form>

      <ConfirmModal
        open={open}
        title={
          pagado
            ? "Estás seguro que querés marcar impaga?"
            : "Estás seguro que querés registrar el pago?"
        }
        description={
          <>
            <p className="text-sm">
              <span className="font-semibold">{labelPeriodo}</span>
            </p>
            <p className="mt-2 text-sm">
              Monto: <span className="font-semibold">{prettyValor}</span>
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {pagado
                ? "Se borrará la fecha de pago y quedará como impaga."
                : "Se guardará la fecha de pago (hoy) y quedará como pagada."}
            </p>
          </>
        }
        confirmText={pagado ? "Sí, marcar impaga" : "Sí, registrar pago"}
        cancelText="Cancelar"
        onConfirm={confirmar}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}