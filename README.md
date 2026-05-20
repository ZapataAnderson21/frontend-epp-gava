# Sistema Web EPP GAVA C&C - Frontend

Frontend del sistema web para la gestion de elementos de seguridad y salud ocupacional de GAVA C&C. Esta aplicacion permite a los usuarios interactuar con modulos como dashboard, proyectos, inventario, requerimientos, trabajadores, usuarios, ordenes de compra y reportes.

## 1. Objetivo del frontend

El objetivo del frontend es proporcionar una interfaz web clara, modular y responsive para registrar, consultar y gestionar la informacion relacionada con elementos de proteccion personal (EPP), equipos de seguridad y emergencia (ESE), equipos de proteccion anticaida (EPA), requerimientos, asignaciones y movimientos de inventario.

## 2. Tecnologias utilizadas

| Tecnologia | Uso principal |
|---|---|
| React | Construccion de componentes de interfaz. |
| Vite | Entorno de desarrollo rapido y generacion de build. |
| TypeScript | Tipado estatico y mayor mantenibilidad del codigo. |
| Tailwind CSS | Estilos de interfaz y diseño responsive. |
| React Router DOM | Navegacion entre modulos del sistema. |
| Socket.IO Client | Comunicacion en tiempo real cuando sea requerida. |
| React Hot Toast | Notificaciones visuales para el usuario. |
| date-fns | Manejo y formato de fechas. |

## 3. Arquitectura general

El frontend se organiza por modulos funcionales, lo cual facilita el mantenimiento del sistema y permite trabajar cada proceso de forma separada.

```text
src/
├── common/              # Componentes reutilizables: paneles, errores, loaders, etc.
├── config/              # Configuracion centralizada del entorno
├── data/                # URLs de API, tipos y utilidades de datos
├── hooks/               # Hooks personalizados para consumo de API y logica comun
├── modules/             # Modulos principales del sistema
│   ├── Dashboard/
│   ├── Elements/
│   ├── Projects/
│   ├── Requests/
│   ├── Users/
│   ├── Workers/
│   └── WorkerMonthlyEvaluations/
├── sections/            # Secciones generales del layout interno
├── App.tsx              # Definicion de rutas principales
└── main.tsx             # Punto de entrada de React
```

## 4. Modulos principales

| Modulo | Descripcion |
|---|---|
| Login | Acceso al sistema y recuperacion de contraseña. |
| Dashboard | Indicadores de elementos entregados, stock minimo y ultimos movimientos. |
| Proyectos | Registro, edicion y consulta de proyectos. |
| Inventario / Elements | Gestion de elementos, familias, variantes y detalles de inventario. |
| Requerimientos | Registro, edicion, revision y seguimiento de solicitudes de equipos. |
| Trabajadores | Consulta de trabajadores e historial relacionado. |
| Usuarios | Gestion de usuarios del sistema. |
| Ordenes de compra | Registro y consulta de ordenes asociadas a proyectos. |
| Emergencias | Registro y seguimiento de emergencias de obra. |
| Reportes | Visualizacion de informacion clave para la toma de decisiones. |

## 5. Requisitos previos

Antes de ejecutar el proyecto se requiere:

- Node.js 20 o superior.
- npm 10 o superior.
- Acceso al backend del sistema.
- Variables de entorno configuradas.

## 6. Instalacion local

Clonar el repositorio:

```bash
git clone https://github.com/ZapataAnderson21/frontend-epp-gava.git
cd frontend-epp-gava
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo de variables de entorno:

```bash
cp .env.example .env
```

Si no existe `.env.example`, crear manualmente un archivo `.env` en la raiz del proyecto.

## 7. Configuracion de variables de entorno

Ejemplo de configuracion local:

```env
VITE_API_URL=http://localhost:3001/
VITE_WS_URL=http://localhost:3001
```

Descripcion de variables:

| Variable | Descripcion |
|---|---|
| VITE_API_URL | URL base del backend REST. Debe terminar en `/` o sera normalizada automaticamente. |
| VITE_WS_URL | URL base para comunicacion WebSocket. |

La configuracion se centraliza en `src/config/env.ts`, desde donde se normalizan las rutas del backend y WebSocket.

## 8. Ejecucion del proyecto

Ejecutar en modo desarrollo:

```bash
npm run dev
```

Compilar para produccion:

```bash
npm run build
```

Previsualizar la version compilada:

```bash
npm run preview
```

Ejecutar analisis de codigo:

```bash
npm run lint
```

## 9. Conexion con el backend

Las rutas de consumo de API se encuentran centralizadas en `src/data/apiUrl.ts`. Algunas rutas principales son:

| Constante | Endpoint base | Uso |
|---|---|---|
| `userApi` | `/user/` | Usuarios y autenticacion. |
| `projectApi` | `/project/` | Gestion de proyectos. |
| `elementApi` | `/element/` | Elementos de seguridad. |
| `requestApi` | `/request/` | Requerimientos. |
| `requestResponseApi` | `/request-response/` | Respuestas y aprobaciones de requerimientos. |
| `workerApi` | `/worker/` | Trabajadores. |
| `inventoryApi` | `/inventory/` | Inventario, movimientos, dashboard y asignaciones. |
| `purchaseOrderApi` | `/purchase-order/` | Ordenes de compra. |
| `supplierApi` | `/supplier/` | Proveedores. |
| `notificationApi` | `/notification/` | Notificaciones. |

## 10. Dashboard y reportes

El dashboard permite visualizar informacion clave de la gestion SSOMA:

- Elementos de proteccion entregados por periodo.
- Filtros por mes y año.
- Detalle del elemento seleccionado.
- Stock minimo cercano o por debajo del minimo.
- Ultimos movimientos de inventario.

Estos reportes apoyan la toma de decisiones sobre compras, reposiciones, redistribucion de equipos y control de elementos retornables.

## 11. Flujo de trabajo con Git

Se recomienda trabajar con ramas por funcionalidad:

```bash
git switch main
git pull origin main
git switch -c feat/nombre-funcionalidad
```

Convencion sugerida de commits:

```bash
git commit -m "feat(inventory): implementar vista de stock"
git commit -m "fix(requests): corregir validacion de cantidades"
git commit -m "docs(readme): actualizar documentacion tecnica"
```

## 12. Despliegue del frontend

Para desplegar el frontend:

1. Configurar las variables de entorno de produccion.
2. Ejecutar el build.
3. Publicar la carpeta `dist/` en el servicio de hosting.

```bash
npm run build
```

La carpeta generada para despliegue es:

```text
dist/
```

El despliegue puede realizarse en Vercel, Netlify, cPanel, Nginx o cualquier servidor que permita servir archivos estaticos.

## 13. Manual basico para desarrolladores

1. Actualizar la rama principal antes de iniciar una tarea.
2. Crear una rama por funcionalidad o correccion.
3. Verificar que el backend este disponible.
4. Configurar `VITE_API_URL` y `VITE_WS_URL`.
5. Ejecutar `npm run dev` para desarrollo local.
6. Probar el modulo modificado desde la interfaz.
7. Ejecutar `npm run lint` antes de subir cambios.
8. Crear un Pull Request para revision.
9. Fusionar cambios a `main` solo despues de validar el funcionamiento.

## 14. Evidencia para el informe

Este README forma parte de la documentacion tecnica en Markdown solicitada para el proyecto. Documenta instalacion, arquitectura, configuracion, conexion con endpoints, ejecucion, despliegue y manual basico para desarrolladores.
