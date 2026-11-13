import Link from "next/link";

export default function CheckoutFalloPage() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#fecaca]/10 flex items-center justify-center mx-auto mb-6 text-[#ef4444] text-3xl">
        ✕
      </div>
      <h1 className="text-3xl font-bold mb-4">El pago no se pudo completar</h1>
      <p className="text-[#64748b] mb-8">
        Inténtalo nuevamente o elige otro método de pago.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href="/checkout"
          className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
        >
          Reintentar pago
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
