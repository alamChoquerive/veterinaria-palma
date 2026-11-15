import Link from "next/link";
import { procesarPagoMP } from "@/core/services/pago-mp.service";
import { VaciarCarrito } from "@/components/carrito/vaciar-carrito";

/**
 * Página de retorno "success" de Mercado Pago (auto_return = "approved").
 *
 * Además de mostrar el mensaje, verifica el pago consultando DIRECTAMENTE
 * la API de MP con el payment_id/collection_id que MP agrega a la URL. En
 * producción también lo confirma el webhook; en local (localhost) el
 * webhook no puede llegar, así que esta verificación es la que marca el
 * pedido como pagado. Es idempotente y solo marca "pagado" si el monto
 * recibido coincide con el total del pedido.
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
      {/* Pago confirmado: el carrito de esa compra queda vacío */}
      <VaciarCarrito />

      <div className="w-16 h-16 rounded-full bg-[#10b981]/10 flex items-center justify-center mx-auto mb-6 text-[#10b981] text-3xl">
        ✓
      </div>
      <h1 className="text-3xl font-bold mb-4">¡Pago aprobado!</h1>
      <p className="text-[#64748b] mb-8">
        Tu compra se ha realizado con éxito. Gracias por confiar en Veterinaria
        Palma.
      </p>

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 inline-block mb-8">
        <p className="text-sm text-[#64748b] mb-2">Estado del pago</p>
        {confirmado && resultado?.pedidoId ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d1fae5] text-[#065f46] text-xs font-semibold">
              Aprobado y registrado
            </span>
            <p className="text-xs text-[#64748b]">
              Pedido #{resultado.pedidoId.slice(0, 8)} quedó marcado como pagado.
            </p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-semibold">
            Estamos confirmando el pago
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/cuenta"
          className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/"
          className="px-6 py-3 text-[#1e293b] rounded-lg font-medium hover:bg-[#f1f5f9] transition-colors border border-[#e2e8f0]"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
