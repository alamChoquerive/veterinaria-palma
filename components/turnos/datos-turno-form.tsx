"use client";

import { Input } from "@/components/ui/input";

interface DatosTurnoFormProps {
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza: string;
  mascotaEdad: string;
  responsableNombre: string;
  responsableTelefono: string;
  motivo: string;
  errores?: Partial<Record<string, string>>;
  onChange: (campo: string, valor: string) => void;
}

const ESPECIES: { value: string; label: string }[] = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "otro", label: "Otro" },
];

function CampoError({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} className="text-xs text-[#991b1b] mt-1" role="alert">
      {mensaje}
    </p>
  );
}

export function DatosTurnoForm({
  mascotaNombre,
  mascotaEspecie,
  mascotaRaza,
  mascotaEdad,
  responsableNombre,
  responsableTelefono,
  motivo,
  errores,
  onChange,
}: DatosTurnoFormProps) {
  const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectClass = `w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${foco}`;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Datos de la mascota</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mascota-nombre" className="block text-xs font-medium text-muted-foreground mb-1">
            Nombre de la mascota *
          </label>
          <Input
            id="mascota-nombre"
            type="text"
            value={mascotaNombre}
            onChange={(e) => onChange("mascotaNombre", e.target.value)}
            required
            aria-invalid={Boolean(errores?.mascotaNombre) || undefined}
            aria-describedby={errores?.mascotaNombre ? "err-mascota-nombre" : undefined}
          />
          <CampoError id="err-mascota-nombre" mensaje={errores?.mascotaNombre} />
        </div>
        <div>
          <label htmlFor="mascota-especie" className="block text-xs font-medium text-muted-foreground mb-1">
            Especie *
          </label>
          <select
            id="mascota-especie"
            value={mascotaEspecie}
            onChange={(e) => onChange("mascotaEspecie", e.target.value)}
            required
            aria-invalid={Boolean(errores?.mascotaEspecie) || undefined}
            aria-describedby={errores?.mascotaEspecie ? "err-mascota-especie" : undefined}
            className={selectClass}
          >
            <option value="" disabled>
              Elegí…
            </option>
            {ESPECIES.map((esp) => (
              <option key={esp.value} value={esp.value}>
                {esp.label}
              </option>
            ))}
          </select>
          <CampoError id="err-mascota-especie" mensaje={errores?.mascotaEspecie} />
        </div>
        <div>
          <label htmlFor="mascota-raza" className="block text-xs font-medium text-muted-foreground mb-1">
            Raza
          </label>
          <Input
            id="mascota-raza"
            type="text"
            value={mascotaRaza}
            onChange={(e) => onChange("mascotaRaza", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="mascota-edad" className="block text-xs font-medium text-muted-foreground mb-1">
            Edad
          </label>
          <Input
            id="mascota-edad"
            type="text"
            value={mascotaEdad}
            onChange={(e) => onChange("mascotaEdad", e.target.value)}
            placeholder="Ej: 3 años"
          />
        </div>
      </div>

      <h3 className="font-semibold">Datos del responsable</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="responsable-nombre" className="block text-xs font-medium text-muted-foreground mb-1">
            Nombre completo *
          </label>
          <Input
            id="responsable-nombre"
            type="text"
            value={responsableNombre}
            onChange={(e) => onChange("responsableNombre", e.target.value)}
            required
            aria-invalid={Boolean(errores?.responsableNombre) || undefined}
            aria-describedby={errores?.responsableNombre ? "err-responsable-nombre" : undefined}
          />
          <CampoError id="err-responsable-nombre" mensaje={errores?.responsableNombre} />
        </div>
        <div>
          <label htmlFor="responsable-telefono" className="block text-xs font-medium text-muted-foreground mb-1">
            Teléfono *
          </label>
          <Input
            id="responsable-telefono"
            type="tel"
            value={responsableTelefono}
            onChange={(e) => onChange("responsableTelefono", e.target.value)}
            required
            aria-invalid={Boolean(errores?.responsableTelefono) || undefined}
            aria-describedby={errores?.responsableTelefono ? "err-responsable-telefono" : undefined}
          />
          <CampoError id="err-responsable-telefono" mensaje={errores?.responsableTelefono} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="motivo" className="block text-xs font-medium text-muted-foreground mb-1">
            Motivo o notas adicionales
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => onChange("motivo", e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring ${foco}`}
          />
        </div>
      </div>
    </div>
  );
}
