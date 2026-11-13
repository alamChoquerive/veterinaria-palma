"use client";

import { useState } from "react";
import { registroAction } from "@/core/actions/auth.action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegistroPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registroAction(formData);
    setLoading(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <main className="flex flex-col items-center justify-center py-20">
      <h2 className="text-2xl font-semibold mb-6">Crear cuenta</h2>
      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input name="nombre" placeholder="Nombre" required />
        <Input name="apellido" placeholder="Apellido" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Contraseña" required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </main>
  );
}
