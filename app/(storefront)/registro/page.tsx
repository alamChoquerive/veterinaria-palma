"use client";

import { useState } from "react";
import Link from "next/link";
import { registroAction } from "@/core/actions/auth.action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegistroPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registroAction(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setExito(true);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center py-20">
      <h2 className="text-2xl font-semibold mb-6">Crear cuenta</h2>
      {exito ? (
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-sm text-[#065f46] bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-3">
            Cuenta creada correctamente. Si tu proyecto de Supabase tiene la
            confirmación de email activada, revisá tu correo antes de entrar.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#1e293b] text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form action={handleSubmit} className="w-full max-w-sm space-y-4">
          <Input name="nombre" placeholder="Nombre" required minLength={2} />
          <Input name="apellido" placeholder="Apellido" required minLength={2} />
          <Input name="email" type="email" placeholder="Email" required />
          <Input
            name="password"
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
      <p className="mt-4 text-sm">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[#1e293b] hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </main>
  );
}
