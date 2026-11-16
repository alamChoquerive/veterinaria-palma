import Link from "next/link";
import { procesarPagoMP } from "@/core/services/pago-mp.service";
import { VaciarCarrito } from "@/components/carrito/vaciar-carrito";
import { formatearMoneda } from "@/lib/utils";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const cta = `px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors ${foco}`;
const secundario = `px-6 py-3 text-primary rounded-lg font-medium hover:bg-accent transition-colors border border-input bg-background ${foco}`;

/**
 * Página de retorno "success" de Mercado Pago.
 *
 * Verifica el pago consultando DIRECTAMENTE la API de MP con el
 * payment_id/collection_id de la URL (en local el webhook no llega a
 * localhost; en producción también lo confirma el webhook). Es idempotente
 * y solo marca "pagado" si el monto recibido coincide con el total del pedido.
 *
 * P0: el carrito SOLO se vacía cuando el pago quedó confirmado; si la
 * verificación falla o está pendiente, el carrito queda intacto.
 */
export default async function CheckoutExitoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp["payment_id"] ?? sp["collection_id"];
  const paymentId = Array.isArray(raw) ? raw[0] : raw;

  let resultado: Awaited<ReturnType<typeof procesarPagoMP>> = null;
  if (paymentId) {
    try {
      resultado = await procesarPagoMP(paymentId);
    } catch (e) {
      console.error("[checkout/exito] No se pudo verificar el pago:", e);
    }
  }

  const confirmado = resultado?.estadoPedido === "pagado";

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 text-center">
      {/* Pago confirmado: recién ahí el carrito de esa compra queda vacío */}
      {confirmado && <VaciarCarrito />}

      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl border ${
          confirmado
            ? "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]"
            : "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
        }`}
        aria-hidden="true"
      >
        {confirmado ? "✓" : "…"}
      </div>
      <span className="sr-only">
        {confirmado ? "Pago aprobado" : "Estamos verificando el pago"}
      </span>
      <h1 className="text-3xl font-bold mb-4">
        {confirmado ? "¡Pago aprobado!" : "Estamos verificando tu pago"}
      </h1>
      <p className="text-muted-foreground mb-8">
        {confirmado
          ? "Tu compra se realizó con éxito. Gracias por confiar en Veterinaria Palma."
          : "Todavía no pudimos confirmar el pago con Mercado Pago. No te preocupes: tu carrito sigue intacto."}
      </p>

      <div className="bg-muted border border-border rounded-xl p-6 inline-block mb-8 text-left">
        <p className="text-sm text-muted-foreground mb-2">Estado del pago</p>
        {confirmado && resultado?.pedidoId ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d1fae5] text-[#065f46] text-xs font-semibold">
              Aprobado y registrado
            </span>
            <p className="text-xs text-muted-foreground">
              Pedido #{resultado.pedidoId.slice(0, 8)} quedó marcado como pagado.
            </p>
            <p className="text-xs text-muted-foreground">
              Monto pagado: {formatearMoneda(resultado.montoPagado)}
              {resultado.totalPedido != null
                ? ` · total del pedido: ${formatearMoneda(resultado.totalPedido)}`
                : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-semibold">
              Estamos confirmando el pago
            </span>
            {resultado?.pedidoId && (
              <p className="text-xs text-muted-foreground">
                Pedido #{resultado.pedidoId.slice(0, 8)} · estado:{" "}
                {resultado.estadoPedido ?? resultado.status}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Si ya pagaste, puede demorar unos segundos en reflejarse. Tu carrito no se vació.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {confirmado ? (
          <>
            <Link href="/cuenta" className={cta}>
              Ver mis pedidos
            </Link>
            <Link href="/" className={secundario}>
              Volver al inicio
            </Link>
          </>
        ) : (
          <>
            <Link href="/checkout" className={cta}>
              Volver al checkout
            </Link>
            <Link href="/cuenta" className={secundario}>
              Ver mis pedidos
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
