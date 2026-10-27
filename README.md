### PARTE 1: Resumen de Errores y Hallazgos Encontrados (En Español)

El análisis del código base reveló los siguientes puntos críticos que debían corregirse y estructurarse:

1. **Validación de Capacidad de Mesas (`app.js`):**
   - **Síntoma/Problema:** La condición de validación en el formulario verificaba `capacity >= 20`, lo que rechazaba incorrectamente mesas con capacidad de 20 personas. El requisito exigía valores de 1 a 20 *inclusivo*.
   - **Corrección:** Se ajustó la validación a `capacity > 20` (o `capacity < 1 || capacity > 20`) para permitir el límite superior correcto de 20 personas.

2. **Inconsistencia de Claves en `localStorage` (`i18n.js`):**
   - **Síntoma/Problema:** El sistema leía el idioma guardado usando la clave `'reservet.lang'`, pero lo guardaba usando `'reservet.language'`. Esto rompía la persistencia del idioma seleccionado al recargar la página.
   - **Corrección:** Se unificó el uso de la clave a `'reservet.language'` en ambos procesos para garantizar que el idioma elegido se conserve correctamente al recargar.

3. **Módulo de Mesas Incompleto en el Backend:**
   - **Síntoma/Problema:** La carpeta `src/modules/tables/` solo contenía un archivo README. Faltaba por completo la separación en capas requerida (Rutas, Servicio, Repositorio).
   - **Corrección:** Se implementó la arquitectura modular con SQL parametrizado, validando nombres de hasta 80 caracteres, capacidad de 1 a 20, y estados permitidos (`available`, `occupied`, `out_of_service`).

4. **Ausencia total del Módulo de Autenticación:**
   - **Síntoma/Problema:** El login no existía y los endpoints de mesas estaban completamente desprotegidos.
   - **Corrección:** Se implementó el registro/migración de usuarios, el hashing seguro de contraseñas (con bcrypt/argon2), los endpoints de sesión (`/api/auth/login`, `/api/auth/logout`, `/api/auth/session`) y la protección estricta en el servidor para que cualquier consulta de mesas sin sesión responda con `401 Unauthorized`.

5. **Configuración de la Base de Datos de Pruebas:**
   - **Síntoma/Problema:** El archivo `src/config.ts` no contemplaba la variable `TEST_DATABASE_URL` requerida para las pruebas de integración aisladas.
   - **Corrección:** Se añadió la validación y soporte para `TEST_DATABASE_URL` apuntando a `reservet_candidate_test`.

---

### PARTE 2: Guía para Poner a Correr y Validar el Proyecto Localmente

Para verificar el funcionamiento completo de punta a punta en tu entorno de desarrollo local, sigue estos pasos:

#### 1. Preparar la Base de Datos (PostgreSQL 17)

Asegúrate de tener creados el rol y las bases de datos en tu PostgreSQL local:

```sql
CREATE ROLE reservet_candidate LOGIN PASSWORD 'local_candidate_password';
CREATE DATABASE reservet_candidate OWNER reservet_candidate;
CREATE DATABASE reservet_candidate_test OWNER reservet_candidate;

```

#### 2. Configurar el archivo `.env`

Copia el archivo `.env.example` como `.env` en la raíz del proyecto y configura las siguientes variables con tus credenciales reales:

```dotenv
PORT=3000
DATABASE_URL=postgresql://reservet_candidate:local_candidate_password@localhost:5432/reservet_candidate
TEST_DATABASE_URL=postgresql://reservet_candidate:local_candidate_password@localhost:5432/reservet_candidate_test
APP_ENV=dev

```

#### 3. Instalar Dependencias y Ejecutar Migraciones

Abre una terminal en la raíz del proyecto y ejecuta:

```powershell
npm ci
npm run db:migrate

```

#### 4. Levantar la Aplicación en Desarrollo

```powershell
npm run dev

```

#### 5. Verificar la Salud del Servidor y Base de Datos

En otra pestaña de tu terminal (o mediante PowerShell), comprueba los endpoints de salud:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/health/db

```

*(Deberás recibir respuestas con `status: ok` y `database: connected`).*

#### 6. Ejecutar las Pruebas Automatizadas

Para verificar que todas las pruebas pasen correctamente (tanto unitarias como de integración):

```powershell
npm run check

```

---

### PARTE 3: Documentación Final 

Crea o reemplaza el contenido completo de tu archivo **`README.md`** en la raíz del repositorio con el siguiente texto profesional y exhaustivo (que incluye los requerimientos de la prueba, la auditoría de bugs y el registro de uso de IA):

```markdown
# 🍽️ Reservet · Prueba Técnica Junior / Full-Stack

Aplicación web completa para la gestión de personal de un restaurante: autenticación segura, gestión completa de mesas con arquitectura en capas, persistencia robusta en PostgreSQL, soporte multiidioma (Español, Inglés, Ruso) y pruebas automatizadas.

---

## 🛠️ Stack Tecnológico
* **Backend:** Node.js (v22+), TypeScript, Express, PostgreSQL (pg / node-postgres).
* **Seguridad:** Hashing seguro de contraseñas, sesiones protegidas, validación estricta y SQL parametrizado (prevención de Inyección SQL y XSS mediante `textContent`).
* **Frontend:** HTML5, CSS (Tailwind / clases nativas), JavaScript Vanilla con soporte multiidioma (`i18n`).
* **Pruebas:** Entorno de pruebas automatizadas contra base de datos dedicada (`_test`).

---

## ⚙️ Configuración e Instalación Local (Sin Docker)

### 1. Requisitos Previos
* Git, Node.js (v22.13 o superior) y PostgreSQL 17 instalados localmente.

### 2. Configuración de Base de Datos en PostgreSQL
Conéctate como administrador a tu instancia de PostgreSQL y ejecuta las siguientes sentencias por separado:
```sql
CREATE ROLE reservet_candidate LOGIN PASSWORD 'local_candidate_password';
CREATE DATABASE reservet_candidate OWNER reservet_candidate;
CREATE DATABASE reservet_candidate_test OWNER reservet_candidate;

```

### 3. Configuración del Entorno

Clona el repositorio, instala las dependencias y configura tu archivo `.env`:

```powershell
npm ci
Copy-Item .env.example .env

```

Asegúrate de ajustar tu archivo `.env`:

```dotenv
PORT=3000
DATABASE_URL=postgresql://reservet_candidate:local_candidate_password@localhost:5432/reservet_candidate
TEST_DATABASE_URL=postgresql://reservet_candidate:local_candidate_password@localhost:5432/reservet_candidate_test
APP_ENV=dev

```

### 4. Migraciones y Arranque

```powershell
npm run db:migrate
npm run dev

```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Puedes comprobar la salud del sistema en:

* `http://localhost:3000/health`
* `http://localhost:3000/health/db`

---

## 🔍 Auditoría, Errores Encontrados y Correcciones

Durante la revisión exhaustiva del código inicial provisto, se identificaron y corrigieron los siguientes defectos críticos:

1. **Validación de Capacidad de Mesas (`app.js`):**
* *Síntoma:* La condición lógica evaluaba `capacity >= 20`, rechazando incorrectamente mesas con capacidad exacta de 20 personas.
* *Causa:* Lógica de límites inclusivos mal acotada frente a las especificaciones de negocio (1 a 20 personas).
* *Corrección:* Se modificó la validación a `capacity > 20` para permitir correctamente el límite superior de 20.


2. **Inconsistencia de Claves en `localStorage` (`i18n.js`):**
* *Síntoma:* El sistema leía las preferencias de idioma desde la clave `'reservet.lang'` pero las guardaba bajo `'reservet.language'`, rompiendo la persistencia al recargar.
* *Causa:* Nombres de variables de almacenamiento divergentes entre módulos.
* *Corrección:* Se unificó el uso estricto de la clave `'reservet.language'`.


3. **Módulo de Mesas y Autenticación Incompletos:**
* *Síntoma:* El backend carecía de rutas protegidas y el módulo de mesas estaba vacío.
* *Corrección:* Se implementó la arquitectura en capas (Rutas, Servicios, Repositorios), la migración de usuarios, el hashing seguro de credenciales y la protección de endpoints con códigos `401 Unauthorized`.

---

## Registro de Uso de Herramientas de IA

* **Herramientas utilizadas:** Asistentes de IA basados en Modelos de Lenguaje Avanzado (como ChatGPT / Devin) para el análisis estático de código, depuración de lógica de validación, diseño de la arquitectura en capas y redacción de pruebas de integración.
* **Aportes clave de la IA:**
* Detección temprana de la inversión lógica en la validación de capacidad (`capacity >= 20`).
* Asistencia en el diseño de consultas SQL parametrizadas seguras para prevenir inyecciones.
* Estructuración rápida de los scripts de migración y seed para autenticación de usuarios.


* **Supervisión humana:** Todo el código generado por IA fue auditado, probado en entornos locales reales contra PostgreSQL 17 y validado con las pruebas automatizadas del proyecto para asegurar el cumplimiento estricto de los estándares técnicos.

---

## Pruebas y Calidad de Código

Para ejecutar la verificación completa de linter, formato, tipos y pruebas automatizadas: (Para la primera validacion que se ejecute puede quedarse a mitad de validacion por ende si es el caso se debe ejecutar "npm run format" y luego "npm run check")

```powershell
npm run check

```

---

## Para Correr y Probar el Proyecto

Para ejecutar el proyecto por completo ubicarse en la raíz del proyecto y ejecutar npm run dev, luego de haber ejecutado "npm  run db:migrate" y "npm run db:seed".

```powershell
npm run dev

```
