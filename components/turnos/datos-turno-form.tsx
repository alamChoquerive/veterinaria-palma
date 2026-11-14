"use client";

interface DatosTurnoFormProps {
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza: string;
  mascotaEdad: string;
  responsableNombre: string;
  responsableTelefono: string;
  responsableEmail: string;
  motivo: string;
  onChange: (campo: string, valor: string) => void;
}

export function DatosTurnoForm({
  mascotaNombre,
  mascotaEspecie,
  mascotaRaza,
  mascotaEdad,
  responsableNombre,
  responsableTelefono,
  responsableEmail,
  motivo,
  onChange,
}: DatosTurnoFormProps) {
  const especies = ["Perro", "Gato", "Otro"];

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Datos de la mascota</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Nombre de la mascota *
          </label>
          <input
            type="text"
            value={mascotaNombre}
            onChange={(e) => onChange("mascotaNombre", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Especie *
          </label>
          <select
            value={mascotaEspecie}
            onChange={(e) => onChange("mascotaEspecie", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
          >
            {especies.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Raza
          </label>
          <input
            type="text"
            value={mascotaRaza}
            onChange={(e) => onChange("mascotaRaza", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Edad
          </label>
          <input
            type="text"
            value={mascotaEdad}
            onChange={(e) => onChange("mascotaEdad", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
            placeholder="Ej: 3 años"
          />
        </div>
      </div>

      <h3 className="font-semibold">Datos del responsable</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            value={responsableNombre}
            onChange={(e) => onChange("responsableNombre", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            value={responsableTelefono}
            onChange={(e) => onChange("responsableTelefono", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Email
          </label>
          <input
            type="email"
            value={responsableEmail}
            onChange={(e) => onChange("responsableEmail", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[#64748b] mb-1">
            Motivo o notas adicionales
          </label>
          <textarea
            value={motivo}
            onChange={(e) => onChange("motivo", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
          />
        </div>
      </div>
    </div>
  );
}
