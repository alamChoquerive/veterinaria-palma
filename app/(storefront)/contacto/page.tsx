"use client";

import { useState } from "react";

export default function ContactoPage() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const nombre = formData.get("nombre") as string;
    const email = formData.get("email") as string;
    const mensaje = formData.get("mensaje") as string;

    if (!nombre || !email || !mensaje) {
      setError("Todos los campos son obligatorios");
      return;
    }

    // Simular envío
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center mx-auto mb-4 text-white text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-[#065f46] mb-2">
            Mensaje enviado
          </h2>
          <p className="text-[#065f46]">Gracias por contactarnos. Te responderemos a la brevedad.</p>
          <a
            href="/contacto"
            className="mt-4 inline-block text-sm text-[#1e293b] hover:underline"
          >
            Enviar otro mensaje
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Contacto</h1>
          <p className="text-[#64748b] leading-relaxed">
            ¿Tenés alguna consulta sobre nuestros servicios o productos?
            Completá el formulario y nos pondremos en contacto contigo.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-[#1e293b]">📍</span>
              <div>
                <div className="font-medium">Dirección</div>
                <div className="text-[#64748b] text-sm">Palma 189, Maipú, Mendoza</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#1e293b]">📞</span>
              <div>
                <div className="font-medium">Teléfono</div>
                <div className="text-[#64748b] text-sm">+54 261 555-1234</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#1e293b]">🕒</span>
              <div>
                <div className="font-medium">Horarios</div>
                <div className="text-[#64748b] text-sm">
                  Lunes a viernes: 9:00 a 19:00<br />
                  Sábados: 9:00 a 14:00<br />
                  Domingos: cerrado
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          action={handleSubmit}
          className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="p-3 rounded bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#64748b]">
              Nombre completo
            </label>
            <input
              name="nombre"
              type="text"
              placeholder="Tu nombre"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#64748b]">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="tu@email.com"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#64748b]">
              Mensaje
            </label>
            <textarea
              name="mensaje"
              rows={5}
              placeholder="Tu consulta..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
          >
            Enviar mensaje
          </button>
        </form>
      </div>
    </main>
  );
}
