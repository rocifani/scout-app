"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  idleText?: string;
  loadingText?: string;
  className?: string;
};

export default function SubmitButton({
  idleText = "Guardar",
  loadingText = "Guardando...",
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {pending && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"
          aria-hidden="true"
        />
      )}

      {pending ? loadingText : idleText}
    </button>
  );
}