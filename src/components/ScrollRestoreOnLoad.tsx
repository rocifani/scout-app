"use client";

import * as React from "react";

const STORAGE_KEY = "ventas-compras:scrollY";

export default function ScrollRestoreOnLoad() {
  React.useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const y = Number(raw);
    if (!Number.isFinite(y)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    const restore = () => {
      window.scrollTo({ top: y, behavior: "auto" });
      attempts += 1;

      if (attempts < maxAttempts) {
        setTimeout(restore, 100);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    };

    setTimeout(restore, 0);

    return () => {
      // no-op
    };
  }, []);

  return null;
}