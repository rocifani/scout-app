"use client";

import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay + blur */}
      <button
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-xl sm:m-4 overflow-hidden rounded-t-xl sm:rounded-xl
                   bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700
                   animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h2>

          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg
                       text-gray-500 hover:text-gray-900 hover:bg-gray-100
                       dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
        </div>

        {/* Footer */}
        <footer className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg
                       border border-gray-200 text-gray-700
                       hover:bg-gray-100
                       dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                       bg-[#FCDB52] text-gray-900
                       hover:bg-[#F3D146] active:bg-[#E9C83D]
                       focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
}
