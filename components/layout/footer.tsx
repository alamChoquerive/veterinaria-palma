export default function Footer() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] mt-auto">
      <div className="px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-[#1e293b] mb-4">Veterinaria Palma</h3>
            <p className="text-sm text-[#64748b] leading-relaxed">
              Todo para tu mascota, con cariño. Mendoza, Argentina.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1e293b] mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm text-[#64748b]">
              <li><a href="/" className="hover:text-[#1e293b]">Inicio</a></li>
              <li><a href="/catalogo" className="hover:text-[#1e293b]">Tienda</a></li>
              <li><a href="/nosotros" className="hover:text-[#1e293b]">Nosotros</a></li>
              <li><a href="/contacto" className="hover:text-[#1e293b]">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1e293b] mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-[#64748b]">
              <li>Palma 189, Maipú, Mendoza</li>
              <li>+54 261 555-1234</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1e293b] mb-4">Horarios</h4>
            <ul className="space-y-2 text-sm text-[#64748b]">
              <li>Lun a vie: 9:00 a 19:00</li>
              <li>Sábados: 9:00 a 14:00</li>
              <li>Domingos: cerrado</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#e2e8f0] pt-4 text-xs text-[#94a3b8] text-center">
          © 2026 Veterinaria Palma · Proyecto final ITU UNCUYO — Desarrollo de Software
        </div>
      </div>
    </footer>
  );
}
