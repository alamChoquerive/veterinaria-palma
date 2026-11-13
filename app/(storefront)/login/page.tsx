"use client";

import { useState } from "react";
import { loginAction } from "@/core/actions/auth.action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await loginAction(formData);
    if (!result.ok) setError(result.error);
  }

  return (
    <main className="flex flex-col items-center justify-center py-20">
      <h2 className="text-2xl font-semibold mb-6">Iniciar sesión</h2>
      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Contraseña" required />
        <input type="hidden" name="redirect" value="/" />
        <Button type="submit" className="w-full">Entrar</Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      <p className="mt-4 text-sm">
        ¿No tenés cuenta? <a href="/registro" className="text-primary">Registrate</a>
      </p>
    </main>
  );
}
