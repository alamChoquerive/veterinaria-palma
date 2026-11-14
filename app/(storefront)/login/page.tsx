"use client";

import { useState, useEffect } from "react";
import { loginAction } from "@/core/actions/auth.action";
import { esRedirectInterno } from "@/lib/redirect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectDestino, setRedirectDestino] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDesdeUrl = params.get("error");
    if (errorDesdeUrl) setError(errorDesdeUrl);
    // Solo se propaga si es una ruta interna (anti open redirect)
    const redirectDesdeUrl = params.get("redirect");
    if (esRedirectInterno(redirectDesdeUrl)) {
      setRedirectDestino(redirectDesdeUrl);
    }
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    setLoading(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <main className="flex flex-col items-center justify-center py-20">
      <h2 className="text-2xl font-semibold mb-6">Iniciar sesión</h2>
      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Contraseña" required />
        <input type="hidden" name="redirect" value={redirectDestino} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      <p className="mt-4 text-sm">
        ¿No tenés cuenta?{" "}
        <a href="/registro" className="text-[#1e293b] hover:underline">
          Registrate
        </a>
      </p>
    </main>
  );
}
