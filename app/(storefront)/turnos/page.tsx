import { createClient } from "@/core/supabase/server";
import { TurnFlow } from "@/components/turnos/turn-flow";

/**
 * La reserva online termina exigiendo sesión (crearTurno valida auth), así que
 * la página lee la sesión real y le avisa al wizard si ya está autenticado:
 * así puede mostrar el aviso/CTA de login ANTES de que el usuario complete
 * los 4 pasos y reciba "Usuario no autenticado" al confirmar.
 */
export default async function TurnosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Reservar turno</h1>
      <p className="text-muted-foreground mb-8">
        Seleccioná la especialidad, fecha y hora para tu consulta veterinaria.
      </p>
      <TurnFlow autenticado={Boolean(user)} />
    </main>
  );
}
