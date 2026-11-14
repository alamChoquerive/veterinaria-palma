"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/core/actions/auth.action";
import { esRedirectInterno } from "@/lib/redirect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  // useSearchParams dentro de Suspense: en build estático el formulario se
  // renderiza en el cliente, así no hay setState en efecto ni mismatch de hidratación
  const searchParams = useSearchParams();
  const errorDesdeUrl = searchParams.get("error");
  // Solo se propaga si es una ruta interna (anti open redirect)
  const redirectDesdeUrl = searchParams.get("redirect");
  const redirectDestino = esRedirectInterno(redirectDesdeUrl)
    ? redirectDesdeUrl
    : "/";

  const [error, setError] = useState<string | null>(errorDesdeUrl);
  const [loading, setLoading] = useState(false);

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
        <Link href="/registro" className="text-[#1e293b] hover:underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
