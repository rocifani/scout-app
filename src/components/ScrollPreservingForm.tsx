"use client";

import * as React from "react";

type Props = React.FormHTMLAttributes<HTMLFormElement> & {
  action?: string | ((formData: FormData) => void | Promise<void>);
};

const STORAGE_KEY = "ventas-compras:scrollY";

export default function ScrollPreservingForm({ children, onSubmit, ...props }: Props) {
  return (
    <form
      {...props}
      onSubmit={(e) => {
        sessionStorage.setItem(STORAGE_KEY, String(window.scrollY));
        onSubmit?.(e);
      }}
    >
      {children}
    </form>
  );
}