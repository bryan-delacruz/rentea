# Rentea

[🇺🇸 Read in English](./README.md)

Gestión de alquileres para propietarios: propiedades, inquilinos, contratos, cobros mensuales, pagos parciales, recibos en PDF y recordatorios por WhatsApp, en español e inglés.

**Demo en vivo:** [rentea-saas.vercel.app](https://rentea-saas.vercel.app) — haz clic en **Try the demo** para entrar a una cuenta de ejemplo con un clic, sin contraseña. Los datos de la demo se reinician cada día.

![Dashboard de Rentea: ocupación, cobrado versus esperado y deuda vencida en soles y dólares](./docs/dashboard.png)

## Qué hace

- **Propiedades e inquilinos.** Cuartos y locales comerciales, con precio en soles (S/) o dólares.
- **Contratos.** Un contrato ocupa una propiedad disponible; al terminarlo, la propiedad vuelve a quedar libre. Los contratos comerciales también registran agua, luz y gas.
- **Cobros mensuales.** Un cron diario crea el cobro del mes para cada contrato activo; el propietario también puede lanzarlo con un botón. Correrlo dos veces nunca duplica un cobro.
- **Pagos.** Registra pagos parciales o totales. Cada cobro muestra si está pagado, parcial, pendiente o vencido, y cuántos días de atraso lleva.
- **Recibos y recordatorios.** Descarga un recibo en PDF, o abre WhatsApp con una confirmación o un recordatorio que incluye el saldo exacto.
- **Dashboard.** Ocupación, dinero cobrado versus esperado y deuda vencida, por periodo y por tipo de propiedad.
- **Dos idiomas.** Toda la interfaz, las pantallas de inicio de sesión, los recibos y los mensajes de WhatsApp cambian entre español e inglés.

## Cómo está construido

| Área | Elección |
| --- | --- |
| App | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Auth | Clerk. Cada consulta y server action está limitada al propietario con sesión iniciada; el registro de otro propietario responde "no encontrado". |
| Datos | PostgreSQL en Neon, Prisma 7. El dinero es `Decimal(12,2)`, las fechas son columnas `date` y los pagos son una tabla de transacciones. |
| Validación | Esquemas Zod en cada server action, con códigos de error tipados que la UI traduce. |
| Arquitectura | Arquitectura limpia: un dominio puro, casos de uso que solo dependen de interfaces (puertos) y adaptadores de Prisma, Clerk, PDF y WhatsApp alrededor. |
| Lógica de cobros | Funciones puras en `src/domain/billing` que trabajan en céntimos enteros y fechas ISO, con "hoy" en hora de Lima. |
| UI | Atomic design (átomos, moléculas, organismos, templates), Tailwind CSS 4, shadcn/ui (Radix), Storybook |
| Tests | Vitest para el dominio, los casos de uso (con repositorios en memoria), formato y validación; Playwright end-to-end en escritorio y móvil |
| Operación | Vercel, con dos crons diarios protegidos por `CRON_SECRET`; GitHub Actions para lint, tipos, tests y build |

```
src/
  domain/                  Entidades y reglas de negocio: cobros, contratos, errores. Sin Next.js ni Prisma.
  application/
    ports.ts               Interfaces que necesitan los casos de uso: repositorios, unidad de trabajo, reloj
    use-cases/             Crear un contrato, registrar un pago, generar los cobros del mes...
    validation.ts          Esquemas Zod para cada entrada
  infrastructure/          Adaptadores: repositorios Prisma, auth con Clerk, recibos PDF, WhatsApp, cron
  server/
    container.ts           Elige el adaptador concreto de cada puerto
    actions/               Server actions delgadas: sesión, validación, caso de uso, revalidación
    queries.ts             Lecturas limitadas al propietario para Server Components
  ui/
    atoms/                 Button, Badge, Input, Money (aquí vive shadcn/ui)
    molecules/             Insignias de estado, grupos de campos, selector de idioma
    organisms/             Navbar, dashboard, formularios y diálogos que llaman a server actions
    templates/             Estructuras de página de la app y del login
  i18n/                    Diccionarios en inglés y español
  app/                     Solo rutas: páginas, layouts, acceso a la demo y crons
e2e/                       Tests de Playwright
prisma/                    Esquema, migraciones y seed de la demo
```

## Correrlo en local

Requisitos: Node.js 24, pnpm 10, una base de datos PostgreSQL (Neon sirve) y una aplicación de Clerk.

```bash
pnpm install
cp .env.example .env.local   # luego completa los valores
pnpm prisma migrate deploy
pnpm prisma:seed user_xxx    # opcional: datos de ejemplo para tu user id de Clerk
pnpm dev
```

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test            # tests unitarios (Vitest)
pnpm test:e2e        # end-to-end (Playwright); necesita DATABASE_URL_TEST
pnpm storybook       # librería de componentes
```

La suite end-to-end corre contra su propia base de datos (`DATABASE_URL_TEST`) y no arranca sin ella. Inicia sesión con usuarios de prueba de Clerk y cubre todo el flujo del propietario, datos inválidos, la protección de rutas, el aislamiento entre propietarios, la demo con un clic y el cambio de idioma.
