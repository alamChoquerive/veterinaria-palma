import Link from "next/link";

export default function GatewayPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-[#1e293b]">
      {/* Barra de emergencias */}
      <div className="bg-[#ef4444] text-white text-xs md:text-sm px-4 py-1.5 flex items-center justify-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.4365.9958A1 1 0 007.757 2.112c9.127 3.076 11.866 10.38 4.295 14.677A10.26 10.26 0 0113.464 19c1.985 0 3.84-.76 5.195-2.006L16.23 20.44a1 1 0 001.552-.548M13.789 3.158c-2.676-.9-5.215-.135-6.96 1.978a1 1 0 00-1.083 1.596c.653 1.093 1.736 1.64 2.812 1.488a1 1 0 00.692-.228m0 0a1 1 0 00.692-.228m-1.083-1.596a1 1 0 00-1.083 1.596M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6"
          />
        </svg>
        <a href="tel:0800VETAYUDA" className="hover:underline">
          Emergencias 24/7: 0800-VET-AYUDA
        </a>
      </div>

      {/* Header restringido del gateway */}
      <header className="border-b border-[#e2e8f0] bg-white px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-white text-sm font-medium">
            P
          </div>
          <span className="font-semibold text-[#1e293b] tracking-tight">Palma</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            aria-label="Iniciar sesión o registrarse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.9 13.9 0 015 20c-1 0 1.954.177 3.857.586M11 9.885V14m4 0v4.111m-10 .111v1.766c0 .832.096 1.653.274 2.454-.365.05-.73.095-1.095.095-1.886 0-3.427-1.4-3.857-3.172A14.6 14.6 0 0111 9.885zM16.564 16.564a1 1 0 01-1.414 0l-2.829-2.829a1 1 0 011.414-1.414l2.829 2.829a1 1 0 010 1.414z"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Split screen: cada mitad ocupa todo el alto y la mitad del ancho,
          y navega directo a su sección (sin pantalla intermedia) */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Mitad Clínica */}
        <Link
          href="/turnos"
          className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-[#f0fdfa] text-[#0f766e] hover:bg-[#ccfbf1] transition-colors duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-[#14b8a6]/10 flex items-center justify-center mb-4 text-[#14b8a6]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider mb-2 opacity-70">Salud y bienestar</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">Clínica Veterinaria</h2>
          <p className="text-md mb-6 max-w-xs text-center">Cuidamos su salud.</p>
          <span className="bg-[#0f766e] text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#115e59] transition-colors flex items-center gap-2">
            Reservar Turno <span>→</span>
          </span>
        </Link>

        {/* Mitad Pet Shop */}
        <Link
          href="/catalogo"
          className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-[#fff7ed] text-[#c2410c] hover:bg-[#ffedd5] transition-colors duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-[#fb923c]/10 flex items-center justify-center mb-4 text-[#fb923c]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider mb-2 opacity-70">Tienda especializada</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">Pet Shop</h2>
          <p className="text-md mb-6 max-w-xs text-center">Todo lo que necesita.</p>
          <span className="bg-[#c2410c] text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#a3360a] transition-colors flex items-center gap-2">
            Comprar Productos <span>→</span>
          </span>
        </Link>
      </main>
    </div>
  );
}
