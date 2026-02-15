"use client";

import { ReactNode, useRef, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteConfirmButton({
  action,
  id,
  title = "Confirmar eliminación",
  description,
  buttonText = "Eliminar",
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar",
  className = "px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 font-semibold text-sm",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number | string;
  title?: string;
  description?: ReactNode;
  buttonText?: string;
  confirmText?: string;
  cancelText?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  function confirmar() {
    formRef.current?.requestSubmit();
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {buttonText}
      </button>

      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="id" value={String(id)} />
      </form>

      <ConfirmModal
        open={open}
        title={title}
        description={
          description ?? (
            <>
              <p className="font-semibold">¿Eliminar este registro?</p>
              <p className="mt-2 text-xs text-gray-500">
                Esta acción no se puede deshacer.
              </p>
            </>
          )
        }
        confirmText={confirmText}
        cancelText={cancelText}
        onConfirm={confirmar}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
