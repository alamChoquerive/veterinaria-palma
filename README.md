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
veterinaria-nextjs/
├── app/                        # Capa de enrutamiento (App Router)
│   ├── (storefront)/           # Vistas para clientes (grupo de rutas)
│   │   ├── catalogo/page.tsx
│   │   ├── turnos/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── carrito/page.tsx
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   ├── nosotros/page.tsx
│   │   └── contacto/page.tsx
│   ├── admin/                  # Back-office (protegido por rol admin)
│   │   ├── dashboard/page.tsx
│   │   ├── inventario/page.tsx
│   │   └── agenda/page.tsx
│   ├── api/
│   │   └── webhooks/mercadopago/route.ts
│   ├── not-found.tsx           # Página 404
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Gateway de entrada
├── components/                 # Capa de presentación
│   ├── ui/                     # Componentes genéricos (button, input, card)
│   ├── layout/                 # Navbar y Footer públicos
│   ├── catalogo/               # ProductCard
│   ├── turnos/                 # CalendarPicker, flujo de turnos
│   ├── carrito/                # CartProvider (estado local)
│   └── admin/                  # AdminLayout
├── core/                       # Capa de negocio y datos
│   ├── actions/                # Server Actions (mutaciones)
│   │   ├── auth.action.ts
│   │   ├── turnos.action.ts
│   │   ├── stock.action.ts
│   │   └── perfil.action.ts
│   ├── services/               # Lógica de negocio pura
│   │   ├── auth.service.ts     # Perfil y verificación de rol
│   │   ├── precios.service.ts  # Precio mayorista vs minorista
│   │   └── envios.service.ts   # Costo de envío local vs provincial
│   └── supabase/               # Clientes de Supabase (browser/server/admin)
├── lib/                        # Utilidades y constantes
│   ├── utils.ts
│   ├── constants.ts
│   └── data/                   # Datos mock temporales (productos, especialidades)
├── types/                      # Tipado TypeScript
│   ├── database.types.ts       # Tipos de Supabase
│   ├── models.d.ts             # Interfaces de dominio
│   └── api.d.ts                # Formatos de respuesta de Server Actions
├── supabase/migrations/        # Migraciones SQL
│   └── 0001_schema_inicial.sql
├── proxy.ts                    # Proxy de Next.js 16 (antes middleware.ts)
├── .env.example                # Plantilla de variables de entorno
├── next.config.ts              # Configuración de Next.js
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
- **Proxy** (`proxy.ts`): protección optimista de rutas públicas y admin.

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

Ejecutar la migración en Supabase SQL Editor:

```
supabase/migrations/0001_schema_inicial.sql
```

Creada tablas: `perfiles`, `categorias`, `productos`, `turnos`, `pedidos`, `pedido_items`, `pagos`, `zonas_envio`.
Incluye trigger automático de perfil al registrarse y políticas RLS por rol.

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
- ✅ Migración SQL con esquema, RLS y trigger de perfil
- ✅ Validación Zod en Server Actions
- ✅ Catálogo con datos reales de Supabase
- ✅ Carrito con estado local
- ✅ Sistema de turnos (flujo multipaso)
- ✅ Login/Registro con Supabase Auth
- ✅ Panel de administración (dashboard, inventario, agenda)
- ✅ Protección de rutas admin por rol (desde servidor)
- ✅ Páginas institucionales (Nosotros, Contacto, 404)
- ✅ Webhook de Mercado Pago (placeholder)
- ⏳ Integración de pagos reales con Mercado Pago (pendiente de credenciales)
- ⏳ Conexión a proyecto Supabase real (pendiente de `.env.local`)

## Licencia

Proyecto universitario — ITU UNCUYO, Desarrollo de Software.
