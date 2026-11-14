import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/core/supabase/server";
import { formatearFecha, formatearMoneda } from "@/lib/utils";

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-[#fef3c7] text-[#92400e]",
  confirmado: "bg-[#dbeafe] text-[#1e40af]",
  atendido: "bg-[#d1fae5] text-[#065f46]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
  pago_pendiente: "bg-[#fef3c7] text-[#92400e]",
  pagado: "bg-[#d1fae5] text-[#065f46]",
  preparacion: "bg-[#dbeafe] text-[#1e40af]",
  enviado: "bg-[#dbeafe] text-[#1e40af]",
  entregado: "bg-[#d1fae5] text-[#065f46]",
  retiro_pendiente: "bg-[#fef3c7] text-[#92400e]",
};

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/cuenta");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, apellido, email, rol")
    .eq("id", user.id)
    .single();

  const { data: turnos } = await supabase
    .from("turnos")
    .select("id, fecha, hora_inicio, hora_fin, estado, motivo")
    .eq("perfil_id", user.id)
    .order("fecha", { ascending: false })
    .limit(10);

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, estado, total, metodo_entrega, created_at")
    .eq("perfil_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const nombreCompleto =
    [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ") ||
    user.email;

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Mi cuenta</h2>
        <p className="text-[#64748b] text-sm">
          {nombreCompleto} · {perfil?.email ?? user.email} · rol{" "}
          <span className="font-medium">{perfil?.rol ?? "minorista"}</span>
        </p>
      </div>

      <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <h3 className="font-semibold mb-4">Mis turnos</h3>
        {turnos && turnos.length > 0 ? (
          <ul className="space-y-2">
            {turnos.map((t) => (
              <li
                key={t.id}
                className="flex justify-between items-center p-2 border rounded-lg text-sm"
              >
                <div>
                  <div className="font-medium">
                    {formatearFecha(t.fecha)} · {t.hora_inicio}–{t.hora_fin}
                  </div>
                  {t.motivo && (
                    <div className="text-[#64748b] text-xs">{t.motivo}</div>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ESTADO[t.estado] ?? "bg-[#e2e8f0] text-[#64748b]"}`}
                >
                  {t.estado}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">
            Todavía no tenés turnos.{" "}
            <Link href="/turnos" className="text-[#1e293b] underline">
              Reservá uno
            </Link>
          </p>
        )}
      </section>

      <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <h3 className="font-semibold mb-4">Mis pedidos</h3>
        {pedidos && pedidos.length > 0 ? (
          <ul className="space-y-2">
            {pedidos.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center p-2 border rounded-lg text-sm"
              >
                <div>
                  <div className="font-medium">Pedido #{p.id.slice(0, 8)}</div>
                  <div className="text-[#64748b] text-xs">
                    {p.metodo_entrega} · {formatearFecha(p.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatearMoneda(Number(p.total))}</div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ESTADO[p.estado] ?? "bg-[#e2e8f0] text-[#64748b]"}`}
                  >
                    {p.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">
            Todavía no hiciste pedidos.{" "}
            <Link href="/catalogo" className="text-[#1e293b] underline">
              Ir a la tienda
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
