import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/core/supabase/server";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import { ETIQUETA_ENVIO, ETIQUETA_ROL } from "@/lib/constants";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { FormFeedback } from "@/components/ui/alert";
import { LogoutButton } from "@/components/cuenta/logout-button";
import { MisDatosForm } from "@/components/cuenta/mis-datos-form";
import { AccionesTurno, AccionesPedido } from "@/components/cuenta/acciones-fila";

/** HH:MM (la columna time llega como "HH:MM:SS"). */
function hhmm(hora: string) {
  return hora.slice(0, 5);
}

export const metadata = {
  title: "Mi cuenta — Veterinaria Palma",
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // aviso=sin-permisos llega cuando un usuario logueado sin el rol necesario
  // entra a /admin/* o /empleado/* (el mensaje es genérico a propósito)
  const { aviso } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/cuenta");
  }

  const { data: perfil, error: errorPerfil } = await supabase
    .from("perfiles")
    .select("nombre, apellido, email, rol, telefono")
    .eq("id", user.id)
    .single();

  const { data: turnos, error: errorTurnos } = await supabase
    .from("turnos")
    .select("id, fecha, hora_inicio, hora_fin, estado, motivo, especialidad, mascota_nombre")
    .eq("perfil_id", user.id)
    .order("fecha", { ascending: false })
    .limit(10);

  const { data: pedidos, error: errorPedidos } = await supabase
    .from("pedidos")
    .select("id, estado, total, metodo_entrega, created_at")
    .eq("perfil_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Ítems de esos pedidos con nombre del producto (mismo patrón que /checkout:
  // el tipo generado no declara la FK, así que se consulta aparte)
  const pedidoIds = (pedidos ?? []).map((p) => p.id);
  let itemsPorPedido = new Map<string, { nombre: string; cantidad: number; subtotal: number }[]>();
  if (pedidoIds.length > 0) {
    const { data: items } = await supabase
      .from("pedido_items")
      .select("pedido_id, cantidad, subtotal, producto_id")
      .in("pedido_id", pedidoIds);
    const productoIds = [...new Set((items ?? []).map((i) => i.producto_id))];
    const { data: prods } = await supabase
      .from("productos")
      .select("id, nombre")
      .in("id", productoIds);
    const nombrePorId = new Map((prods ?? []).map((p) => [p.id, p.nombre]));
    itemsPorPedido = new Map();
    for (const item of items ?? []) {
      const lista = itemsPorPedido.get(item.pedido_id) ?? [];
      lista.push({
        nombre: nombrePorId.get(item.producto_id) ?? "Producto",
        cantidad: item.cantidad,
        subtotal: Number(item.subtotal),
      });
      itemsPorPedido.set(item.pedido_id, lista);
    }
  }

  const nombreCompleto =
    [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ") || user.email;

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Mi cuenta</h1>
          <p className="text-muted-foreground text-sm">
            {nombreCompleto} · {perfil?.email ?? user.email}
            {perfil?.rol && (
              <> · cuenta <span className="font-medium">{ETIQUETA_ROL[perfil.rol] ?? perfil.rol}</span></>
            )}
          </p>
        </div>
        <LogoutButton />
      </div>

      {aviso === "sin-permisos" && (
        <FormFeedback tipo="error">
          No tenés permisos para entrar a esa sección. Si creés que es un error, contactanos.
        </FormFeedback>
      )}

      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Mis datos</h2>
        {errorPerfil ? (
          <p role="alert" className="text-sm text-[#991b1b]">
            No pudimos cargar tu perfil. Recargá la página.
          </p>
        ) : (
          <MisDatosForm
            nombre={perfil?.nombre ?? ""}
            apellido={perfil?.apellido ?? ""}
            telefono={perfil?.telefono ?? ""}
            email={perfil?.email ?? user.email ?? ""}
          />
        )}
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-semibold">Mis turnos</h2>
          {turnos && turnos.length > 0 && (
            <span className="text-xs text-muted-foreground">Últimos {turnos.length}</span>
          )}
        </div>
        {errorTurnos ? (
          <p role="alert" className="text-sm text-[#991b1b] bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3">
            No pudimos cargar tus turnos. Recargá la página para verlos.
          </p>
        ) : turnos && turnos.length > 0 ? (
          <ul className="space-y-2">
            {turnos.map((t) => (
              <li
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border border-border rounded-lg text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {formatearFecha(t.fecha)} · {hhmm(t.hora_inicio)}–{hhmm(t.hora_fin)}
                    {t.especialidad && (
                      <span className="text-muted-foreground font-normal"> · {t.especialidad}</span>
                    )}
                  </div>
                  {(t.mascota_nombre || t.motivo) && (
                    <div className="text-muted-foreground text-xs line-clamp-2">
                      {[t.mascota_nombre, t.motivo].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <EstadoBadge estado={t.estado} tipo="turno" />
                  <AccionesTurno turnoId={t.id} estado={t.estado} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no tenés turnos.{" "}
            <Link href="/turnos" className="text-primary underline font-medium">
              Reservá uno
            </Link>
          </p>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-semibold">Mis pedidos</h2>
          {pedidos && pedidos.length > 0 && (
            <span className="text-xs text-muted-foreground">Últimos {pedidos.length}</span>
          )}
        </div>
        {errorPedidos ? (
          <p role="alert" className="text-sm text-[#991b1b] bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3">
            No pudimos cargar tus pedidos. Recargá la página para verlos.
          </p>
        ) : pedidos && pedidos.length > 0 ? (
          <ul className="space-y-2">
            {pedidos.map((p) => {
              const items = itemsPorPedido.get(p.id) ?? [];
              return (
                <li
                  key={p.id}
                  className="p-3 border border-border rounded-lg text-sm space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Pedido #{p.id.slice(0, 8)}</div>
                      <div className="text-muted-foreground text-xs">
                        {ETIQUETA_ENVIO[p.metodo_entrega] ?? p.metodo_entrega} ·{" "}
                        {formatearFecha(p.created_at)}
                        {items.length > 0 && <> · {items.length} producto{items.length > 1 ? "s" : ""}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <div className="font-medium">{formatearMoneda(Number(p.total))}</div>
                      <EstadoBadge estado={p.estado} tipo="pedido" />
                    </div>
                  </div>
                  {items.length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none font-medium text-primary hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Ver detalle del pedido
                      </summary>
                      <ul className="mt-2 space-y-1 pl-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex justify-between gap-4">
                            <span>
                              {item.cantidad}× {item.nombre}
                            </span>
                            <span className="tabular-nums">{formatearMoneda(item.subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <AccionesPedido pedidoId={p.id} estado={p.estado} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hiciste pedidos.{" "}
            <Link href="/catalogo" className="text-primary underline font-medium">
              Ir a la tienda
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
