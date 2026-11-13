export default function NosotrosPage() {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Nosotros</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Veterinaria Palma</h2>
        <p className="text-lg text-[#64748b] leading-relaxed mb-4">
          Somos una clínica veterinaria y pet shop comprometidos con el
          bienestar de tus mascotas. Combinamos atención médica profesional con
          una tienda especializada para ofrecerte todo lo que tu compañero
          necesita en un solo lugar.
        </p>
        <p className="text-lg text-[#64748b] leading-relaxed">
          Nuestro equipo de veterinarios y cuidadores trabaja diariamente para
          brindar un servicio cálido, confiable y de calidad.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-[#f0fdfa] p-6 rounded-xl border border-[#ccfbf1]">
          <h3 className="font-semibold text-[#0f766e] mb-2">Clínica Veterinaria</h3>
          <p className="text-sm text-[#64748b]">
            Consultas, vacunación, cirugías, ecografías y análisis clínicos para
            el cuidado de la salud de tu mascota.
          </p>
        </div>
        <div className="bg-[#fff7ed] p-6 rounded-xl border border-[#fdba74]">
          <h3 className="font-semibold text-[#c2410c] mb-2">Pet Shop</h3>
          <p className="text-sm text-[#64748b]">
            Alimentos balanceados, accesorios, juguetes, higiene y farmacia
            veterinaria para perros y gatos.
          </p>
        </div>
        <div className="bg-[#f8fafc] p-6 rounded-xl border border-[#e2e8f0]">
          <h3 className="font-semibold text-[#1e293b] mb-2">Turnos 24/7</h3>
          <p className="text-sm text-[#64748b]">
            Reserva tu turno online desde cualquier lugar y horario. Atendemos
            cuando más nos necesites.
          </p>
        </div>
      </section>

      <section className="bg-white border border-[#e2e8f0] rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">¿Tenés una consulta?</h2>
        <p className="text-[#64748b] mb-6">
          Visitanos o escribínos. Estamos para ayudarte.
        </p>
        <a
          href="/contacto"
          className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
        >
          Contactarnos
        </a>
      </section>
    </main>
  );
}
