# Decisiones de Arquitectura — Librería Javeriana

## Índice

1. [Arquitectura hexagonal](#1-arquitectura-hexagonal)
2. [Por qué Drizzle ORM en lugar de Prisma / TypeORM](#2-por-qué-drizzle-orm-en-lugar-de-prisma--typeorm)
3. [Uso de inteligencia artificial](#3-uso-de-inteligencia-artificial)
4. [Mejoras pendientes](#4-mejoras-pendientes)

---

## 1. Arquitectura hexagonal

### Concepto aplicado

La arquitectura hexagonal (también llamada *Ports & Adapters*) separa el sistema en tres anillos concéntricos:

```
┌──────────────────────────────────────────┐
│            Infrastructure                │
│  ┌────────────────────────────────────┐  │
│  │          Application               │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │          Domain              │  │  │
│  │  │  (entidades, servicios,      │  │  │
│  │  │   interfaces de repositorio) │  │  │
│  │  └──────────────────────────────┘  │  │
│  │  (casos de uso / orquestación)     │  │
│  └────────────────────────────────────┘  │
│  (Fastify, Drizzle, PostgreSQL, Awilix)  │
└──────────────────────────────────────────┘
```

### Regla de dependencias

Las dependencias **sólo apuntan hacia adentro**: la infraestructura conoce la aplicación, la aplicación conoce el dominio, pero el dominio no conoce a nadie más. Esto se hizo cumplir mediante:

- `src/domain/` no importa nada de Fastify, Drizzle, Zod ni Awilix.
- `src/application/services/` depende únicamente de las interfaces `IBookRepository` e `ILoanRepository` definidas en `src/domain/repository/`.
- `src/infrastructure/repositories/` implementa esas interfaces adaptando Drizzle al contrato del dominio.
- El único lugar donde las clases concretas se conectan con las interfaces es `src/configuration/container.ts` (el *composition root*).

### Por qué favorece la testeabilidad del dominio

Al no tener dependencias externas, la lógica de negocio se puede probar con tests unitarios que corren en milisegundos y sin necesidad de levantar una base de datos. Por ejemplo, `LoanDomainService` calcula fechas de vencimiento y detecta préstamos atrasados con lógica pura, cubierta al 100 % por `LoanDomainService.test.ts` sin ningún mock de infraestructura.

Los casos de uso (`CreateLoanUseCase`, `ReturnBookUseCase`, etc.) se prueban con repositorios en memoria que implementan las mismas interfaces (`IBookRepository`, `ILoanRepository`), lo que permite validar toda la lógica de orquestación sin tocar PostgreSQL.

### Por qué facilita el cambio de framework

Si en el futuro se quisiera reemplazar Fastify por Express, Hono o cualquier otro framework HTTP, los únicos archivos que cambiarían serían los de `src/infrastructure/api/`. El dominio y los casos de uso permanecerían intactos. Lo mismo aplica a la base de datos: si se migrara de PostgreSQL a MySQL o a una base de datos en memoria, bastaría con crear nuevas implementaciones de `IBookRepository` e `ILoanRepository`.

### Regla de mapeo de errores

Los errores de dominio (`BookNotFoundError`, `NoAvailableCopiesError`, `LoanNotFoundError`) son clases que extienden `DomainError`. La traducción a códigos HTTP ocurre **exclusivamente** en el error handler global de Fastify (`server.ts`), no en los casos de uso. Esto evita que el dominio sepa qué protocolo de transporte se está usando.

---

## 2. Por qué Drizzle ORM en lugar de Prisma / TypeORM

### Comparativa de herramientas

| Criterio | Drizzle ORM | Prisma | TypeORM |
|----------|------------|--------|---------|
| Generación de tipos | Inferida desde el schema TS | Generada (codegen) | Decoradores en runtime |
| SQL explícito | Sí, con type-safety total | Limitado | Parcial |
| Tamaño del bundle | Muy ligero | Motor + binarios Rust | Pesado |
| Migraciones | `drizzle-kit generate / migrate` | `prisma migrate` | Entidad-driven |
| Transacciones manuales | `db.transaction(tx => ...)` nativo | API de nivel inferior | `QueryRunner` verboso |
| Compatibilidad ESM | Nativa | Requiere configuración extra | Problemática |

### Razones concretas de la elección

**Type-safety sin magia de código generado.** Con Drizzle, el esquema de base de datos se define directamente en TypeScript (`src/infrastructure/repositories/schema.ts`) y los tipos `BookRow`, `LoanRow`, etc. se infieren automáticamente con `typeof table.$inferSelect`. No hay paso de generación de código que pueda quedar desincronizado con el esquema real.

**SQL explícito cuando importa.** La operación crítica del sistema — decrementar `available_copies` sin race condition — se implementa como:

```sql
UPDATE books
SET available_copies = available_copies - 1
WHERE isbn = $1 AND available_copies > 0
RETURNING *
```

Drizzle permite escribir esto de forma type-safe sin perder el control sobre la cláusula `WHERE`. Con Prisma o TypeORM habría que recurrir a `$queryRaw` perdiendo la inferencia de tipos.

**Transacciones de primera clase.** `db.transaction(tx => ...)` en Drizzle funciona de forma natural y composable. La operación de préstamo (decremento de copias + inserción del préstamo) y la devolución (actualización de estado + incremento de copias) se envuelven en transacciones atómicas sin verbosidad adicional.

**Ligereza y compatibilidad ESM.** El proyecto usa `"type": "module"` en `package.json`. Drizzle funciona nativamente con ESM; Prisma requería configuración adicional para este entorno.

---

## 3. Uso de inteligencia artificial

Durante el desarrollo de este proyecto se utilizó **Claude Code** (Anthropic) como asistente de programación. A continuación se describe de forma honesta cómo se incorporó y en qué medida se revisaron sus salidas.

### Qué se usó

| Tarea | Rol de la IA | Revisión manual |
|-------|-------------|----------------|
| Diseño de la arquitectura hexagonal y separación de capas | Propuesta y discusión de trade-offs | ✅ Se ajustó la estructura de carpetas según las restricciones del assessment |
| Definición del esquema SQL (tablas, enum, constraints, índices) | Generación inicial | ✅ Se verificó cada constraint (`chk_copies_positive`, índice parcial en `due_date`) y se validó la atomicidad del `UPDATE ... WHERE available_copies > 0` |
| Implementación de los repositorios Postgres | Generación del código base | ✅ Se revisó la lógica de transacción y el manejo de errores en `PostgresLoanRepository` |
| Schemas de validación Zod | Generación y ajuste de regexes ISBN | ✅ Se probó contra ISBNs válidos e inválidos |
| Casos de uso y dominio | Sugerencias estructurales | ✅ Se revisó que ningún caso de uso importara clases de infraestructura directamente |
| Tests unitarios de `LoanDomainService` | Generación de casos edge | ✅ Se añadieron casos adicionales (préstamo vence exactamente hoy) |
| Redacción de este documento | Estructura y contenido | ✅ Revisado y ampliado manualmente |

### Qué no se delegó a la IA

- Las decisiones de diseño finales (qué constraints añadir, cómo estructurar el DI container).
- La verificación de que la atomicidad del `UPDATE ... RETURNING *` protege realmente contra condiciones de carrera bajo concurrencia.
- La elección de herramientas (Drizzle vs Prisma, Awilix vs tsyringe).

### Principio aplicado

Todo el código generado por IA fue **leído línea a línea y entendido** antes de ser integrado. Ningún fragmento fue copiado como caja negra. Si algo no era comprensible o tenía comportamiento dudoso, se reescribió o se buscó una alternativa más clara.

---

## 4. Mejoras pendientes

Las siguientes mejoras están fuera del alcance de este assessment pero serían los próximos pasos naturales en un entorno productivo.

### Paginación en el endpoint de vencidos

`GET /loans/overdue` devuelve actualmente todos los préstamos vencidos sin límite. Con grandes volúmenes de datos, esto puede saturar la respuesta. La solución sería añadir parámetros `?page=1&limit=20` y devolver metadatos de paginación (`total`, `pages`, `currentPage`).

### Soft delete para libros

El endpoint `POST /books` no tiene un `DELETE /books/:isbn` correspondiente. En un sistema real, los libros no deben borrarse físicamente porque existen préstamos históricos que referencian su ISBN. La solución es añadir una columna `deleted_at TIMESTAMPTZ` y filtrar `WHERE deleted_at IS NULL` en todas las consultas de negocio.

### Autenticación JWT

Actualmente cualquier cliente puede crear préstamos para cualquier `userId`. Un middleware de autenticación JWT validaría el token en cada request y extraería el `userId` del payload, eliminando la necesidad de enviarlo en el body (y el riesgo de suplantación).

### Rate limiting

Para proteger la API de abuso, se podría añadir `@fastify/rate-limit` con límites por IP o por token de usuario, especialmente en los endpoints de escritura.

### Generación de especificación OpenAPI

Fastify tiene soporte nativo para generar OpenAPI 3.0 a partir de schemas JSON Schema. Integrando `@fastify/swagger` y `@fastify/swagger-ui` se obtendría documentación interactiva sin esfuerzo adicional, dado que los schemas Zod ya están definidos.

### Monitoreo y observabilidad

En producción sería conveniente añadir:
- Métricas con `@fastify/metrics` (Prometheus)
- Trazas distribuidas (OpenTelemetry)
- Alertas sobre el número de préstamos vencidos en tiempo real
