import Link from "next/link";

export default function CheckoutExitoPage() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4 text-center">
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
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d1fae5] text-[#065f46] text-xs font-semibold">
          Aprobado
        </span>
      </div>
      <Link
        href="/"
        className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
