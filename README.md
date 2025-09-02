# Mesa - Frontend (Next.js)

Interfaz web para la gestión de turnos. Autenticación con Auth0 y consumo del backend de Mesa.

- Integrante: Alan Sanjurjo

## Requisitos
- Node.js 18+ (recomendado LTS)
- npm (o yarn/pnpm/bun)

## Variables de entorno
Crear un archivo .env.local en front/ con las siguientes claves (ejemplo):

```
# URL del backend (Spring Boot)
BACKEND_URL=http://localhost:8080

# URLs de app
APP_BASE_URL=http://localhost:3000
AUTH0_BASE_URL=http://localhost:3000

# Auth0 (adaptar a tu tenant)
AUTH0_ISSUER_BASE_URL=https://TU_TENANT.us.auth0.com
AUTH0_CLIENT_ID=XXXX
AUTH0_CLIENT_SECRET=XXXX
AUTH0_SECRET=XXXX
AUTH0_AUDIENCE=https://mesa-api

# Claim donde viajan los roles en el token
NEXT_PUBLIC_AUTH0_ROLES_CLAIM=https://mesa/roles
```

Notas:
- No subir .env.local con secretos reales a repositorios públicos.
- AUTH0_AUDIENCE debe coincidir con el "Identifier" de la API creada en Auth0.
- NEXT_PUBLIC_AUTH0_ROLES_CLAIM debe coincidir con el usado por el backend.

## Instalación y ejecución (desarrollo)
1) Posicionarse en la carpeta front/.
2) Crear .env.local con las variables anteriores.
3) Instalar dependencias: npm install
4) Iniciar el servidor de desarrollo: npm run dev
5) Abrir http://localhost:3000

## Build y ejecución (producción)
- Compilar: npm run build
- Ejecutar: npm start

## Tecnologías utilizadas
- Next.js 15 (App Router)
- React 19
- @auth0/nextjs-auth0
- Tailwind CSS 4
- TypeScript

## Integración con el Backend
- Asegurar que BACKEND_URL apunte al backend corriendo (por defecto http://localhost:8080).
- El backend debe permitir CORS desde FRONTEND_ORIGIN (configurado en su .env).
