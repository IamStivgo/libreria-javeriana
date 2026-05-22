# 📚 Librería Javeriana — Sistema de Préstamos

REST API para la gestión de préstamos de la biblioteca universitaria de la Pontificia Universidad Javeriana (DTI).

Construida con **Node.js + TypeScript**, **Fastify**, **Drizzle ORM** y **PostgreSQL**, siguiendo una arquitectura hexagonal estricta.

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 20 LTS        |
| npm         | 10+           |
| Docker      | 24+           |
| Docker Compose | v2 (plugin) |

---

## Configuración inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/IamStivgo/libreria-javeriana.git
cd libreria-javeriana
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores. La configuración por defecto ya apunta al contenedor Docker incluido:

```env
DATABASE_URL=postgresql://libreria_user:libreria_password@localhost:5432/library
PORT=3000
NODE_ENV=development
DEFAULT_LOAN_DAYS=14
```

> Si alguna variable está ausente o tiene un valor inválido, la aplicación **no arrancará** y mostrará un mensaje de error claro.

### 4. Levantar la base de datos

```bash
docker compose up -d
```

Esto inicia PostgreSQL 15 en el puerto `5432` con un volumen persistente (`postgres_data`).

Verifica que el contenedor esté saludable antes de continuar:

```bash
docker compose ps
```

### 5. Ejecutar migraciones

```bash
npm run db:migrate
```

Esto aplica el esquema inicial (tablas `books` y `loans`, enum `loan_status`, índices y constraints).

### 6. Iniciar el servidor en modo desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000`. Verifica con:

```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload (`tsx watch`) |
| `npm run build` | Compilar TypeScript → `dist/` |
| `npm start` | Ejecutar build compilado |
| `npm test` | Ejecutar suite de tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run lint` | Analizar código con ESLint |
| `npm run lint:fix` | Corregir errores de lint automáticamente |
| `npm run format` | Formatear con Prettier |
| `npm run db:generate` | Generar nuevas migraciones (Drizzle Kit) |
| `npm run db:migrate` | Aplicar migraciones pendientes |

---

## Endpoints de la API

Todos los endpoints responden en formato JSON con la siguiente estructura:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### 🔵 Libros

#### `POST /books` — Registrar un libro

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "9780132350884",
    "title": "Clean Code",
    "area": "Ingeniería de Software",
    "totalCopies": 5
  }'
```

**Respuesta `201 Created`:**
```json
{
  "success": true,
  "data": {
    "isbn": "9780132350884",
    "title": "Clean Code",
    "area": "Ingeniería de Software",
    "totalCopies": 5,
    "availableCopies": 5,
    "createdAt": "2026-05-22T10:00:00.000Z"
  }
}
```

#### `GET /books/:isbn/availability` — Consultar disponibilidad

```bash
curl http://localhost:3000/books/9780132350884/availability
```

**Respuesta `200 OK`:**
```json
{
  "success": true,
  "data": {
    "isbn": "9780132350884",
    "title": "Clean Code",
    "availableCopies": 4,
    "isAvailable": true
  }
}
```

---

### 🟢 Préstamos

#### `POST /loans` — Crear un préstamo

```bash
curl -X POST http://localhost:3000/loans \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "9780132350884",
    "userId": "estudiante-001",
    "dueDays": 7
  }'
```

> `dueDays` es opcional; si se omite usa `DEFAULT_LOAN_DAYS` (14 días por defecto).

**Respuesta `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isbn": "9780132350884",
    "userId": "estudiante-001",
    "loanDate": "2026-05-22T10:00:00.000Z",
    "dueDate": "2026-05-29T10:00:00.000Z",
    "returnedAt": null,
    "status": "ACTIVE"
  }
}
```

#### `PATCH /loans/:id/return` — Devolver un libro

```bash
curl -X PATCH http://localhost:3000/loans/550e8400-e29b-41d4-a716-446655440000/return
```

**Respuesta `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isbn": "9780132350884",
    "userId": "estudiante-001",
    "loanDate": "2026-05-22T10:00:00.000Z",
    "dueDate": "2026-05-29T10:00:00.000Z",
    "returnedAt": "2026-05-25T15:30:00.000Z",
    "status": "RETURNED"
  }
}
```

#### `GET /loans/overdue` — Listar préstamos vencidos

```bash
curl http://localhost:3000/loans/overdue
```

**Respuesta `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "isbn": "9780132350884",
      "userId": "estudiante-002",
      "loanDate": "2026-05-01T08:00:00.000Z",
      "dueDate": "2026-05-15T08:00:00.000Z",
      "returnedAt": null,
      "status": "ACTIVE"
    }
  ]
}
```

---

### Códigos de error

| Código HTTP | Código interno | Causa |
|-------------|---------------|-------|
| `400` | `VALIDATION_ERROR` | Body o parámetros inválidos (Zod) |
| `404` | `BOOK_NOT_FOUND` | ISBN no registrado |
| `404` | `LOAN_NOT_FOUND` | UUID de préstamo no encontrado |
| `409` | `NO_AVAILABLE_COPIES` | El libro no tiene ejemplares disponibles |
| `500` | `INTERNAL_SERVER_ERROR` | Error inesperado del servidor |

---

## Ejecutar tests

```bash
# Todos los tests (unitarios + integración)
npm test

# Con cobertura de código
npm run test:coverage
```

Los tests **no requieren base de datos**. Los casos de uso se prueban con repositorios en memoria; el dominio con lógica pura.

---

## Estructura del proyecto

```
src/
├── application/        # Casos de uso (orquestación)
│   ├── dto/            # Schemas Zod de entrada
│   └── services/       # CreateLoanUseCase, ReturnBookUseCase, …
├── domain/             # Núcleo puro — sin dependencias externas
│   ├── entities/       # Interfaces Book, Loan
│   ├── exceptions/     # DomainError y subclases
│   ├── models/         # LoanStatus enum
│   ├── repository/     # Interfaces IBookRepository, ILoanRepository
│   └── services/       # LoanDomainService (lógica pura)
├── infrastructure/     # Adaptadores externos
│   ├── api/            # Fastify: server, routes, schemas
│   └── repositories/   # PostgresBookRepository, PostgresLoanRepository
├── configuration/      # Contenedor Awilix + cliente Drizzle
│   ├── container.ts
│   └── database.ts
├── util/
│   └── env.ts          # Validación de variables de entorno
└── main.ts             # Punto de entrada
```
