-- ============================================================
-- Veterinaria Palma — SEED de datos de PRUEBA
--
-- NO es una migración: ejecutarlo en Supabase → SQL Editor
-- DESPUÉS de aplicar las migraciones 0001–0006.
-- Es idempotente: si se corre dos veces no duplica filas.
-- ============================================================

-- ---------- Categorías ----------
insert into public.categorias (nombre, descripcion)
select v.nombre, v.descripcion
  from (values
    ('Alimentos',      'Alimentos balanceados y snacks para perros y gatos'),
    ('Higiene',        'Shampoos, antipulgas y cuidado dermatológico'),
    ('Juguetes',       'Juguetes resistentes y de enriquecimiento'),
    ('Accesorios',     'Collares, correas y camas')
  ) as v(nombre, descripcion)
 where not exists (select 1 from public.categorias c where c.nombre = v.nombre);

-- ---------- Productos ----------
-- Precios en ARS. precio_mayorista < precio_minorista (se congela según el rol
-- del comprador al crear el pedido, ver RPC crear_pedido).
-- La "Cama acolchada" queda con stock <= stock_minimo a propósito para ver el
-- badge de stock bajo en el dashboard admin.
-- El último producto queda activo = false para comprobar que no aparece en el catálogo.
insert into public.productos
  (categoria_id, nombre, descripcion, precio_minorista, precio_mayorista, stock, stock_minimo, imagen_url, activo)
select c.id, v.nombre, v.descripcion, v.precio_minorista, v.precio_mayorista,
       v.stock, v.stock_minimo, v.imagen_url, v.activo
from public.categorias c
join (values
  ('Alimentos',   'Alimento balanceado perro adulto 15 kg',   'Bolsa de 15 kg, pollo y arroz',            28500, 23900, 20, 5,  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=60', true),
  ('Alimentos',   'Alimento balanceado gato adulto 7 kg',     'Bolsa de 7 kg, salmón',                    24900, 21000, 15, 4,  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=60', true),
  ('Alimentos',   'Snacks de entrenamiento para perros',      'Bolsa 200 g, alto valor de recompensa',    4500,  3800,  40, 10, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=60', true),
  ('Higiene',     'Shampoo neutro hipoalergénico 500 ml',     'Para pieles sensibles, pH neutro',          8900,  7500,  30, 6,  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=60', true),
  ('Higiene',     'Pipeta antipulgas perros medianos',        'Dosis 10-25 kg, protección 30 días',       12500, 10500, 25, 5,  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=60', true),
  ('Juguetes',    'Pelota de goma resistente',                'Tamaño grande, rebote irregular',          3200,  2600,  50, 10, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=60', true),
  ('Juguetes',    'Kong clásica talla M',                      'Para rellenar con pasta o premios',        9800,  8200,  18, 4,  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=60', true),
  ('Accesorios',  'Collar regulable de nylon',                 'Talles S a L, hebilla metálica',            6500,  5400,  35, 8,  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=800&q=60', true),
  ('Accesorios',  'Correa extensible 5 m',                     'Sistema de bloqueo, cinta reflectiva',      14500, 12200, 12, 3,  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=60', true),
  ('Accesorios',  'Cama acolchada mediana',                    'Lavable, base antideslizante',              32000, 27000, 2,  5,  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=60', true),
  ('Alimentos',   'PRODUCTO DE PRUEBA INACTIVO',               'No debe verse en el catálogo público',      1000,  800,   99, 0,  null, false)
) as v(categoria, nombre, descripcion, precio_minorista, precio_mayorista, stock, stock_minimo, imagen_url, activo)
  on c.nombre = v.categoria
where not exists (select 1 from public.productos p where p.nombre = v.nombre);

-- ---------- Usuarios de prueba (ejecutar DESPUÉS de registrarse en la app) ----------
-- OJO: Supabase Auth RECHAZA dominios reservados (RFC 2606: .test, .example,
-- .invalid, .localhost) con error email_address_invalid (HTTP 400 en /signup).
-- Por eso las cuentas de prueba usan dominios reales, ej. gmail:
-- 1) Crear las cuentas desde /registro con estos emails:
--      cliente.palma@gmail.com    (queda con rol 'minorista' automático)
--      mayorista.palma@gmail.com
--      admin.palma@gmail.com
-- 2) Promover roles (la auto-promoción está bloqueada a propósito, migración 0002):
-- update public.perfiles set rol = 'mayorista' where email = 'mayorista.palma@gmail.com';
-- update public.perfiles set rol = 'admin'     where email = 'admin.palma@gmail.com';

-- ---------- Utilidades para pruebas ----------
-- Resetear el rate limit si te bloquea mientras probás:
-- delete from public.rate_limit_eventos;
--
-- Ver los últimos pedidos y sus estados:
-- select id, estado, metodo_entrega, costo_envio, total, created_at from public.pedidos order by created_at desc limit 10;
--
-- Ver los pagos registrados por el webhook:
-- select proveedor_pago_id, estado, monto, created_at from public.pagos order by created_at desc limit 10;
