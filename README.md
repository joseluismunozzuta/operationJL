# 🕵️ Expediente Confidencial JL

> **CASO N.° 001** — Invitación de cumpleaños con temática de expediente de investigación confidencial. Los invitados son "testigos" citados a declarar, y cada uno recibe al azar una pregunta secreta para el interrogatorio grupal del día del evento.

Construida como una SPA de una sola página con [Next.js](https://nextjs.org) 16 (App Router) y [Firebase](https://firebase.google.com) (Auth + Firestore).

## El concepto

El cumpleaños de JL se enmarca como un caso bajo investigación:

- **Los hechos** — fecha, hora y lugar del evento, con link directo a Google Maps.
- **Registro de testigo** — los invitados inician sesión con Google y "declaran" si asistirán. Pueden actualizar su declaración cuando quieran, desde cualquier dispositivo.
- **Interrogatorio** — al confirmar asistencia, cada testigo recibe al azar (sin repetir, hasta agotar el banco de 30) una pregunta sobre JL que debe guardar en secreto hasta el día del caso — revelada con una animación de sobre sellado.
- **Evidencia requerida** — wishlist de regalos, administrable desde el panel y mostrada como una galería pública.
- **Revelación del expediente** — el día del evento, la lista completa de testigo → pregunta se desclasifica públicamente (la fecha de corte se aplica a nivel de reglas de Firestore, no solo en el cliente).
- **Panel del investigador** (`/admin`) — protegido con Google Sign-In, solo accesible para la cuenta configurada como administradora. Permite ver confirmaciones, sembrar el banco de preguntas y gestionar la wishlist.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19.2, React Compiler)
- **TypeScript** estricto
- **Tailwind CSS v4** (tema oscuro carbón/ámbar/rojo, tipografía tipo máquina de escribir)
- **Firebase**: Authentication (Google) + Firestore (sin backend propio — todo se resuelve desde el cliente vía reglas de seguridad)

## Estructura

```
src/
  app/
    page.tsx            # Página pública: ensambla todas las secciones
    admin/page.tsx       # Panel del investigador (protegido)
    layout.tsx, globals.css
  components/
    CaseStamp.tsx        # Sello de goma reusable (CLASIFICADO / APROBADO)
    Countdown.tsx         # Countdown en vivo hasta el evento
    sections/             # Hero, Facts, RsvpForm, Gifts, Kahoot, Notes, GroupReveal
  lib/
    firebase.ts           # Init de Firebase + helpers de Google Sign-In
    event-config.ts       # Fecha, lugar, link de Kahoot, email del admin
    questions.ts          # Banco de 30 preguntas del interrogatorio
    rsvp.ts                # Lógica de RSVP y asignación de preguntas (transacción)
    wishlist.ts            # CRUD de la wishlist/evidencia
firestore.rules            # Reglas de seguridad (pegar manualmente en Firebase Console)
```

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase Console (proyecto `operationjl`)

Estos pasos son manuales, se hacen una sola vez desde [console.firebase.google.com](https://console.firebase.google.com):

1. **Authentication → Sign-in method**: habilitar el proveedor **Google**.
2. **Firestore Database**: crear la base de datos (modo producción, elegir región).
3. **Firestore → Reglas**: pegar el contenido de [`firestore.rules`](firestore.rules) y publicar.

La configuración pública del SDK ya está incluida en [`src/lib/firebase.ts`](src/lib/firebase.ts) — no requiere variables de entorno.

### 3. Correr en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 4. Sembrar el banco de preguntas

Entrar a `/admin`, iniciar sesión con la cuenta configurada como `ADMIN_EMAIL` (en [`event-config.ts`](src/lib/event-config.ts)) y usar el botón **"Sembrar preguntas"**. Es idempotente — no duplica si ya existen.

## Editar el contenido

Todo el contenido específico del evento vive en [`src/lib/event-config.ts`](src/lib/event-config.ts): fecha/hora, dirección, link de Kahoot y el email del administrador. El banco de preguntas está en [`src/lib/questions.ts`](src/lib/questions.ts).

## Scripts

```bash
npm run dev      # Servidor de desarrollo (Turbopack)
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # ESLint
```
