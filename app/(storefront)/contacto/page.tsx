"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTACTO, HORARIOS_TURNO } from "@/lib/constants";
import { esEmailValido } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function ContactoPage() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const mensaje = String(formData.get("mensaje") ?? "").trim();

    if (!nombre || !email || !mensaje) {
      setError("Todos los campos son obligatorios");
      return;
    }
    if (!esEmailValido(email)) {
      setError("Ingresá un email válido");
      return;
    }

    // Envío honesto: no hay backend de email, así que abrimos el cliente de
    // correo del usuario con el mensaje ya armado dirigido a la clínica.
    // Antes esto "simulaba" el envío y mostraba "Mensaje enviado" sin enviar nada.
    const asunto = `Consulta de ${nombre}`;
    const cuerpo = `${mensaje}\n\n— ${nombre} (${email})`;
    window.location.href = `mailto:${CONTACTO.EMAIL}?subject=${encodeURIComponent(
      asunto,
    )}&body=${encodeURIComponent(cuerpo)}`;
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-background border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Abrimos tu email</h2>
          <p className="text-muted-foreground mb-2">
            Te abrimos el cliente de correo con tu mensaje dirigido a{" "}
            <span className="font-medium text-foreground">{CONTACTO.EMAIL}</span>.
            Dale enviar desde ahí y te respondemos a la brevedad.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Si no se abrió nada, escribinos directo a{" "}
            <a href={`mailto:${CONTACTO.EMAIL}`} className={`underline font-medium ${foco}`}>
              {CONTACTO.EMAIL}
            </a>{" "}
            o llamanos al{" "}
            <a href={CONTACTO.TELEFONO_HREF} className={`underline font-medium ${foco}`}>
              {CONTACTO.TELEFONO}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => setEnviado(false)}
            className={`px-6 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors ${foco}`}
          >
            Escribir otro mensaje
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Contacto</h1>
          <p className="text-muted-foreground leading-relaxed">
            ¿Tenés alguna consulta sobre nuestros servicios o productos?
            Escribinos y te respondemos en horario de atención.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-primary" aria-hidden="true">📍</span>
              <div>
                <div className="font-medium">Dirección</div>
                <div className="text-muted-foreground text-sm">{CONTACTO.DIRECCION}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary" aria-hidden="true">📞</span>
              <div>
                <div className="font-medium">Teléfono</div>
                <div className="text-muted-foreground text-sm">
                  <a href={CONTACTO.TELEFONO_HREF} className={`hover:underline ${foco}`}>
                    {CONTACTO.TELEFONO}
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary" aria-hidden="true">🕒</span>
              <div>
                <div className="font-medium">Horarios</div>
                <div className="text-muted-foreground text-sm">
                  Lunes a viernes: {HORARIOS_TURNO.DESDE} a {HORARIOS_TURNO.HASTA}
                  <br />
                  Sábados y domingos: cerrado
                  <br />
                  Emergencias 24/7:{" "}
                  <a href={CONTACTO.TELEFONO_HREF} className={`hover:underline ${foco}`}>
                    {CONTACTO.TELEFONO}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            ¿Preferís atendemos ahora?{" "}
            <Link href="/turnos" className={`underline font-medium text-primary ${foco}`}>
              Reservá tu turno online
            </Link>
            .
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-background border border-border rounded-xl p-6 space-y-4 h-fit"
        >
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="contacto-nombre" className="block text-sm font-medium text-muted-foreground">
              Nombre completo
            </label>
            <Input id="contacto-nombre" name="nombre" type="text" placeholder="Tu nombre" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contacto-email" className="block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <Input id="contacto-email" name="email" type="email" placeholder="tu@email.com" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contacto-mensaje" className="block text-sm font-medium text-muted-foreground">
              Mensaje
            </label>
            <textarea
              id="contacto-mensaje"
              name="mensaje"
              rows={5}
              placeholder="Tu consulta..."
              required
              className={`w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${foco}`}
            />
          </div>
          <button
            type="submit"
            className={`w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors ${foco}`}
          >
            Enviar mensaje
          </button>
          <p className="text-xs text-muted-foreground">
            Al enviar se abre tu cliente de email con el mensaje dirigido a {CONTACTO.EMAIL}.
          </p>
        </form>
      </div>
    </main>
  );
}
