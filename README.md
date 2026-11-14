# Veterinaria Palma

Plataforma de comercio electrónico 24/7 para una veterinaria con tienda para mascotas incluida. Construida con **Next.js 16**, **Supabase** y **TypeScript**.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Lenguaje | TypeScript |
| Base de datos y Auth | Supabase (PostgreSQL, Auth, RLS) |
| Estilos | Tailwind CSS v4 |
| Gestión de estado | React `useState` (carrito local), Server Actions para mutaciones |
| Validación | Zod v4 |
| Paquete de gestión | pnpm 12 |

## Estructura del proyecto

```
veterinaria-palma/
├── app/                        # Capa de enrutamiento (App Router)
│   ├── (storefront)/           # Vistas para clientes (grupo de rutas)
│   │   ├── catalogo/page.tsx   # Catálogo real desde Supabase
│   │   ├── carrito/page.tsx
│   │   ├── checkout/page.tsx   # + /exito y /fallo (retorno de Mercado Pago)
│   │   ├── turnos/page.tsx     # Flujo multipaso de reserva
│   │   ├── login/ registro/ nosotros/ contacto/
│   ├── admin/                  # Back-office (protegido por rol admin)
│   │   ├── dashboard/page.tsx  # KPIs
│   │   ├── inventario/page.tsx # Server component + tabla client
│   │   └── agenda/page.tsx     # Server component + tabla client
│   ├── api/
│   │   └── webhooks/mercadopago/route.ts  # Webhook verificado (firma + API)
│   ├── not-found.tsx           # Página 404
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Gateway de entrada
├── components/                 # Capa de presentación
│   ├── ui/                     # Componentes genéricos (button, input, card)
│   ├── layout/                 # Navbar y Footer públicos
│   ├── catalogo/               # ProductoCard con botón Agregar funcional
│   ├── turnos/                 # Flujo de turnos (4 pasos)
│   ├── carrito/                # CartProvider (estado local)
│   ├── checkout/               # CheckoutFlow + DeliveryForm
│   └── admin/                  # Tablas client (inventario-table, agenda-table)
├── core/                       # Capa de negocio y datos
│   ├── actions/                # Server Actions (mutaciones, validadas con Zod)
│   │   ├── auth.action.ts      # login/registro con rate limit por IP
│   │   ├── pedido.action.ts    # crearPedido vía RPC crear_pedido (service_role)
│   │   ├── pago.action.ts      # crearPreferenciaPago (monto solo desde la DB)
│   │   ├── turnos.action.ts    # crearTurno vía RPC + cancelarTurno por RLS
│   │   ├── stock.action.ts     # ajuste atómico con compare-and-swap
│   │   ├── perfil.action.ts
│   │   └── schemas.ts          # Esquemas Zod compartidos
│   ├── services/               # Lógica de negocio pura (precios, envíos)
│   ├── supabase/               # Clientes: client.ts (browser), server.ts, admin.ts (service_role)
│   └── rate-limit.ts           # Rate limit con ventana deslizante en Postgres
├── lib/                        # Utilidades, constantes y redirect seguro
│   ├── utils.ts  constants.ts  redirect.ts (esRedirectInterno)
│   └── data/especialidades.ts
├── types/                      # Tipado TypeScript
│   ├── database.types.ts       # Tipos de Supabase incl. RPCs
│   ├── models.d.ts
│   └── api.d.ts
├── supabase/migrations/        # Migraciones SQL 0001 a 0006
├── proxy.ts                    # Proxy de Next.js 16: sesión + headers de seguridad/CSP
├── .env.example                # Plantilla de variables de entorno
├── next.config.ts
└── README.md
```

## Funcionalidades implementadas

### Para clientes (storefront)

- **Gateway de entrada**: elección entre Clínica Veterinaria y Pet Shop, con barra de emergencias 24/7.
- **Catálogo de productos**: listado de productos con stock, precios minorista/mayorista y agregar al carrito.
- **Carrito de compras**: estado local (agregar, aumentar, disminuir, eliminar, total).
- **Sistema de turnos**: flujo de 4 pasos (especialidad → fecha y hora → datos → confirmación).
- **Autenticación**: login y registro con Supabase Auth.
- **Páginas institucionales**: Nosotros, Contacto y 404.

### Para administradores (panel /admin)

- **Dashboard**: KPIs (stock bajo, turnos pendientes, pedidos pendientes, ventas totales).
- **Inventario**: gestión de stock de mercaderías con ajuste +/-.
- **Agenda de turnos**: lista de turnos con filtros por estado y cancelación.

### Arquitectura interna

- **Server Components por defecto**: las páginas cargan datos desde el servidor.
- **Server Actions aisladas**: `core/actions/` con validación Zod y verificación de auth/rol interna.
- **RLS (Row Level Security)**: políticas de seguridad en Supabase por rol (minorista, mayorista, admin).
- **RPCs SECURITY DEFINER solo para service_role**: `crear_pedido`, `crear_turno` y `verificar_rate_limit` — el cliente nunca toca precios, stock ni reglas de negocio.
- **Proxy** (`proxy.ts`): chequeo optimista de sesión + headers de seguridad en todas las respuestas (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS en producción).
- **Rate limiting** en Postgres (ventana deslizante con advisory lock): 5 login/registro cada 15 min por IP; 10 pedidos/min y 5 turnos cada 5 min por usuario.
- **Webhook de Mercado Pago endurecido**: firma `x-signature`, consulta del pago real en la API de MP, comparación de monto, idempotencia y transiciones de estado solo hacia adelante.
- **Anti open redirect** (`lib/redirect.ts`), cookies de sesión `secure` en producción + `sameSite: lax`, errores genéricos al cliente (el detalle va al log del servidor).

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
MERCADOPAGO_ACCESS_TOKEN=<access-token>
MERCADOPAGO_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<public-key>
```

## Base de datos

Ejecutar las migraciones **en orden** en el SQL Editor de Supabase:

```
supabase/migrations/0001_schema_inicial.sql          -- esquema base + RLS + trigger de perfil
supabase/migrations/0002_seguridad_rls.sql           -- anti auto-promoción admin, unique en pagos, índices
supabase/migrations/0003_crear_pedido_rpc.sql        -- RPC crear_pedido (service_role)
supabase/migrations/0004_zonas_envio_metodo_entrega.sql -- zonas por método de entrega
supabase/migrations/0005_crear_turno_rpc.sql         -- RPC crear_turno (service_role) + WITH CHECK
supabase/migrations/0006_rate_limit.sql              -- tabla + RPC verificar_rate_limit
```

Tablas: `perfiles`, `categorias`, `productos`, `turnos`, `pedidos`, `pedido_items`, `pagos`, `zonas_envio`, `rate_limit_eventos`.

## Webhook de Mercado Pago

Configurar en el panel de Mercado Pago → Tus integraciones → Webhooks una URL pública apuntando a:

```
https://<tu-dominio>/api/webhooks/mercadopago
```

Con las credenciales de producción en las variables de entorno del deploy (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`).

## Cómo correr el proyecto

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar la migración SQL en Supabase Dashboard

# Iniciar servidor de desarrollo
pnpm dev
```

## Estado del proyecto

- ✅ Estructura de carpetas y arquitectura por capas
- ✅ Clientes de Supabase (browser, server, admin service-role)
- ✅ Migraciones SQL 0001–0006 (esquema, RLS endurecido, RPCs, rate limit)
- ✅ Validación Zod en Server Actions
- ✅ Catálogo, carrito y checkout con datos reales de Supabase
- ✅ Flujo completo catálogo → carrito → checkout → pago Mercado Pago → webhook verificado
- ✅ Sistema de turnos (flujo multipaso con validación server-side en RPC)
- ✅ Login/Registro con Supabase Auth + rate limiting
- ✅ Panel de administración (dashboard, inventario, agenda) protegido por rol
- ✅ Páginas institucionales (Nosotros, Contacto, 404)
- ✅ Seguridad: CSP + headers en el proxy, open redirect cerrado, cookies `secure` en producción, errores genéricos al cliente, RPCs solo service_role
- ✅ `pnpm exec tsc --noEmit`, `pnpm exec eslint . --max-warnings 0` y `pnpm build` en verde
- ⏳ Deploy a producción (Vercel u otro) con las variables de entorno y el webhook de MP apuntando al dominio público

## Licencia

Proyecto universitario — ITU UNCUYO, Desarrollo de Software.
