import Link from "next/link";
import { CONTACTO, HORARIOS_TURNO } from "@/lib/constants";

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
              <li><Link href="/" className="hover:text-[#1e293b]">Inicio</Link></li>
              <li><Link href="/catalogo" className="hover:text-[#1e293b]">Tienda</Link></li>
              <li><Link href="/nosotros" className="hover:text-[#1e293b]">Nosotros</Link></li>
              <li><Link href="/contacto" className="hover:text-[#1e293b]">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1e293b] mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-[#64748b]">
              <li>{CONTACTO.DIRECCION}</li>
              <li>
                <a href={CONTACTO.TELEFONO_HREF} className="hover:text-[#1e293b]">
                  {CONTACTO.TELEFONO}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1e293b] mb-4">Horarios</h4>
            <ul className="space-y-2 text-sm text-[#64748b]">
              <li>Lun a vie: {HORARIOS_TURNO.DESDE} a {HORARIOS_TURNO.HASTA}</li>
              <li>Sábados y domingos: cerrado</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#e2e8f0] pt-4 text-xs text-[#94a3b8] text-center">
          © 2026 Veterinaria Palma · Emergencias 24/7:{" "}
          <a href={CONTACTO.TELEFONO_HREF} className="hover:underline">{CONTACTO.TELEFONO}</a>
        </div>
      </div>
    </footer>
  );
}
