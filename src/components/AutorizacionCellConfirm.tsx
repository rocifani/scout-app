"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

type AutProtaRow = {
  id: number;
  entregada: boolean | null;
};

const SCROLL_KEY = "table-scroll-y";

function estadoClass(entregada: boolean) {
  return entregada
    ? "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
    : "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100";
}

export default function AutorizacionCellConfirm({
  registro,
  marcarEntregadaAction,
  marcarNoEntregadaAction,
  labelAutorizacion,
}: {
  registro?: AutProtaRow;
  marcarEntregadaAction: (formData: FormData) => Promise<void>;
  marcarNoEntregadaAction: (formData: FormData) => Promise<void>;
  labelAutorizacion: string;
}) {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fEntregar = useRef<HTMLFormElement | null>(null);
  const fQuitar = useRef<HTMLFormElement | null>(null);

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

  if (!registro) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  }

  const entregada = !!registro.entregada;

  function confirmar() {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    setOpen(false);

    if (entregada) {
      fQuitar.current?.requestSubmit();
    } else {
      fEntregar.current?.requestSubmit();
    }
  }

  return (
    <div className="space-y-2 min-w-44">
      <div className="flex items-center justify-between gap-2">
        <span className={estadoClass(entregada)}>
          {entregada ? "Entregada" : "Pendiente"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-lg text-xs font-semibold
                   border border-gray-200 text-gray-700 hover:bg-gray-100
                   dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700
                   focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
      >
        {entregada ? "Marcar pendiente" : "Marcar entregada"}
      </button>

      <form ref={fEntregar} action={marcarEntregadaAction} className="hidden">
        <input type="hidden" name="id" value={registro.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
      </form>

      <form ref={fQuitar} action={marcarNoEntregadaAction} className="hidden">
        <input type="hidden" name="id" value={registro.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
      </form>

      <ConfirmModal
        open={open}
        title={entregada ? "Confirmar: marcar pendiente" : "Confirmar: marcar entregada"}
        description={
          <>
            <p className="text-sm">
              Autorización: <span className="font-semibold">{labelAutorizacion}</span>
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {entregada
                ? "Quedará como pendiente de entrega."
                : "Quedará registrada como entregada."}
            </p>
          </>
        }
        confirmText={entregada ? "Sí, marcar pendiente" : "Sí, marcar entregada"}
        cancelText="Cancelar"
        onConfirm={confirmar}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}