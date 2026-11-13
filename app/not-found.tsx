import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-[#1e293b] mb-2">404</h1>
      <p className="text-xl text-[#64748b] mb-8">
        Página no encontrada
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
