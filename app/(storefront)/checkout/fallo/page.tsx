import Link from "next/link";
import { procesarPagoMP } from "@/core/services/pago-mp.service";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const cta = `px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors ${foco}`;
const secundario = `px-6 py-3 text-primary rounded-lg font-medium hover:bg-accent transition-colors border border-input bg-background ${foco}`;

function primero(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Vuelta "failure"/"pending" de Mercado Pago.
 *
 * Distingue el estado real: un pago PENDIENTE (Rapipago/Pago Fácil) no es un
 * rechazo — se muestra la referencia para pagar en el punto de pago y se deja
 * claro que el carrito sigue intacto (acá nunca se vacía). Un rechazo sí
 * permite reintentar, y /checkout retoma el pedido pendiente si existe en vez
 * de duplicarlo.
 */
export default async function CheckoutFalloPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const collectionStatus = primero(sp["collection_status"])?.toLowerCase();
  const statusParam = primero(sp["status"])?.toLowerCase();
  const paymentId = primero(sp["payment_id"]) ?? primero(sp["collection_id"]);
  const externalReference = primero(sp["external_reference"]);
  const preferenceId = primero(sp["preference_id"]);
  const referencia = paymentId ?? externalReference ?? preferenceId ?? null;

  // Si volvemos con payment_id, sincronizamos el estado del pedido (idempotente)
  // para no depender solo de los query params de MP.
  let resultado: Awaited<ReturnType<typeof procesarPagoMP>> = null;
  if (paymentId) {
    try {
      resultado = await procesarPagoMP(paymentId);
    } catch (e) {
      console.error("[checkout/fallo] No se pudo sincronizar el pago:", e);
    }
  }

  const status = (resultado?.status ?? statusParam ?? collectionStatus ?? "").toLowerCase();
  const esPendiente =
    status === "pending" || status === "in_process" || collectionStatus === "pending";
  const esRechazado =
    status === "rejected" || status === "cancelled" || collectionStatus === "rejected";

  const titulo = esPendiente
    ? "Tu pago quedó pendiente"
    : esRechazado
      ? "El pago fue rechazado"
      : "El pago no se pudo completar";
  const copy = esPendiente
    ? "Todavía tenés que pagar en el punto de pago (Rapipago/Pago Fácil) usando la referencia de abajo, antes de que venza. No se realizó ningún cobro todavía."
    : esRechazado
      ? "No se realizó ningún cobro. Podés reintentar el pago con el mismo pedido; tu carrito sigue intacto."
      : "Ocurrió un problema al procesar el pago. Tu carrito sigue intacto: podés reintentar desde el checkout.";
  const icono = esPendiente ? "⏳" : "✕";
  const colorIcono = esPendiente
    ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
    : "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";
  const sr = esPendiente ? "Pago pendiente" : "Pago no completado";

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 text-center">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl border ${colorIcono}`}
        aria-hidden="true"
      >
        {icono}
      </div>
      <span className="sr-only">{sr}</span>
      <h1 className="text-3xl font-bold mb-4">{titulo}</h1>
      <p className="text-muted-foreground mb-4">{copy}</p>

      {esPendiente && referencia && (
        <div className="bg-muted border border-border rounded-xl p-4 mb-6 inline-block">
          <p className="text-xs text-muted-foreground mb-1">Referencia de pago</p>
          <p className="font-mono text-sm font-semibold break-all">{referencia}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Pedido #{externalReference ? externalReference.slice(0, 8) : "—"}
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-8">
        Tu carrito sigue intacto: no lo vaciamos porque el pago no está aprobado.
      </p>

      <div className="flex flex-col gap-3">
        <Link href="/checkout" className={`${cta} w-full`}>
          {esPendiente ? "Ver mi pedido pendiente" : "Reintentar pago"}
        </Link>
        <Link href="/" className={`${secundario} w-full`}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
