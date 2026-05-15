"use client";

import { useRef, useTransition } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  ventaId: number;
  compradorTipo: "protagonista" | "educador" | "grupo";
  idProtagonista?: number | null;
  idEducador?: number | null;
  checked: boolean;
  returnTo: string;
};

export default function InlineRetiroAllCheckbox({
  action,
  ventaId,
  compradorTipo,
  idProtagonista = null,
  idEducador = null,
  checked,
  returnTo,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={action} className="inline-flex items-center justify-center">
      <input type="hidden" name="venta_id" value={ventaId} />
      <input type="hidden" name="comprador_tipo" value={compradorTipo} />
      <input type="hidden" name="id_protagonista" value={idProtagonista ?? ""} />
      <input type="hidden" name="id_educador" value={idEducador ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <input
        type="checkbox"
        name="checkbox_ui"
        defaultChecked={checked}
        disabled={pending}
        onChange={(e) => {
          const form = formRef.current;
          if (!form) return;

          const oldRetiro = form.querySelector('input[name="retiro"]');
          if (oldRetiro) oldRetiro.remove();

          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = "retiro";          // 👈 único cambio respecto al original
          hidden.value = e.target.checked ? "true" : "false";
          form.appendChild(hidden);

          startTransition(() => {
            form.requestSubmit();
          });
        }}
        className="h-4 w-4 rounded border-gray-300"
      />
    </form>
  );
}