-- ============================================================
-- Veterinaria Palma — Migración 0003: creación transaccional de pedidos
--
-- public.crear_pedido(...):
--   - Calcula precios según el rol del comprador (minorista/mayorista)
--   - Toma el costo de envío de la tabla zonas_envio (fuente de verdad)
--   - Valida stock y lo descuenta ATÓMICAMENTE (FOR UPDATE + update
--     condicional), todo dentro de una única transacción: si algo falla,
--     no queda ningún pedido, ítem ni descuento a mitad de camino.
--
-- Solo puede ejecutarla el servidor (service_role). Se revoca EXECUTE a
-- anon/authenticated/public para que ningún cliente pueda llamarla directo
-- por REST e inyectar precios o descontar stock a mano.
-- ============================================================

create or replace function public.crear_pedido(
  p_perfil_id uuid,
  p_metodo_entrega text,
  p_direccion_envio text,
  p_items jsonb -- [{ "producto_id": uuid, "cantidad": int }]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_costo_envio numeric := 0;
  v_subtotal numeric := 0;
  v_total numeric;
  v_pedido_id uuid;
  v_item jsonb;
  v_prod record;
  v_precio numeric;
  v_cantidad int;
begin
  -- Perfil del comprador
  select rol into v_rol from public.perfiles where id = p_perfil_id;
  if not found then
    raise exception 'Perfil no encontrado';
  end if;

  -- Método de entrega válido
  if p_metodo_entrega not in ('retiro_tienda', 'envio_local', 'envio_provincial') then
    raise exception 'Método de entrega inválido';
  end if;

  -- Dirección obligatoria cuando hay envío
  if p_metodo_entrega <> 'retiro_tienda'
     and (p_direccion_envio is null or btrim(p_direccion_envio) = '') then
    raise exception 'La dirección de envío es obligatoria para este método de entrega';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene ítems';
  end if;

  -- Costo de envío desde zonas_envio (nunca desde el cliente)
  if p_metodo_entrega = 'retiro_tienda' then
    v_costo_envio := 0;
  else
    select costo into v_costo_envio
    from public.zonas_envio
    where activo = true
      and tipo = case when p_metodo_entrega = 'envio_local' then 'local' else 'provincial' end
    order by costo asc
    limit 1;
    if not found then
      raise exception 'No hay una zona de envío activa para este método';
    end if;
  end if;

  -- Primera pasada: validar productos activos, cantidades y stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cantidad := (v_item ->> 'cantidad')::int;
    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad inválida';
    end if;

    select * into v_prod
    from public.productos
    where id = (v_item ->> 'producto_id')::uuid and activo = true;

    if not found then
      raise exception 'Producto no disponible';
    end if;

    if v_prod.stock < v_cantidad then
      raise exception 'Stock insuficiente para %', v_prod.nombre;
    end if;

    v_precio := case when v_rol = 'mayorista' then v_prod.precio_mayorista else v_prod.precio_minorista end;
    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  v_total := v_subtotal + v_costo_envio;

  -- Crear el pedido con estado inicial forzado
  insert into public.pedidos (perfil_id, estado, metodo_entrega, direccion_envio, costo_envio, total)
  values (p_perfil_id, 'pago_pendiente', p_metodo_entrega, nullif(btrim(p_direccion_envio), ''), v_costo_envio, v_total)
  returning id into v_pedido_id;

  -- Segunda pasada: bloquear las filas de productos, insertar los ítems con
  -- precio congelado y descontar el stock de forma atómica
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cantidad := (v_item ->> 'cantidad')::int;

    select * into v_prod
    from public.productos
    where id = (v_item ->> 'producto_id')::uuid
    for update;

    v_precio := case when v_rol = 'mayorista' then v_prod.precio_mayorista else v_prod.precio_minorista end;

    insert into public.pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v_pedido_id, v_prod.id, v_cantidad, v_precio, v_precio * v_cantidad);

    update public.productos
    set stock = stock - v_cantidad, updated_at = now()
    where id = v_prod.id and stock >= v_cantidad;

    if not found then
      raise exception 'Stock insuficiente por cambio concurrente para %', v_prod.nombre;
    end if;
  end loop;

  return jsonb_build_object(
    'pedido_id', v_pedido_id,
    'subtotal', v_subtotal,
    'costo_envio', v_costo_envio,
    'total', v_total
  );
end;
$$;

-- Solo el servidor (service_role) puede ejecutar la función
revoke execute on function public.crear_pedido(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido(uuid, text, text, jsonb) to service_role;
