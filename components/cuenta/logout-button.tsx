"use client";

import { useState } from "react";
import { logoutAction } from "@/core/actions/auth.action";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * Cerrar sesión con confirmación inline en dos pasos: antes era un submit
 * directo y un misclic te sacaba de la cuenta sin preguntar.
 */
export function LogoutButton() {
  const [pidiendo, setPidiendo] = useState(false);

  if (pidiendo) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">¿Cerrar sesión?</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className={`border border-border rounded-lg px-3 py-2 text-xs font-medium text-[#991b1b] hover:bg-[#fee2e2] transition-colors ${foco}`}
          >
            Sí, salir
          </button>
        </form>
        <button
          type="button"
          onClick={() => setPidiendo(false)}
          className={`border border-border rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors ${foco}`}
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPidiendo(true)}
      className={`border border-border rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors ${foco}`}
    >
      Cerrar sesión
    </button>
  );
}
