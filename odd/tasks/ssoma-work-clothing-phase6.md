# Fase 6 — UX de Requerimientos SSOMA y Ropa de Trabajo

## Objetivo

Unificar Requerimientos SSOMA y ofrecer una experiencia compacta para despachos,
recepciones, custodia, entregas, historial y constancias de Ropa de Trabajo.

## Alcance autorizado

- Un solo listado de requerimientos con filtro de tipo SSOMA.
- Selector obligatorio de Inicio de Obra o Durante la Ejecución.
- Catálogo seleccionable limitado a Ropa, EPP y Equipos de Seguridad.
- Módulo Feature-Based de Ropa de Trabajo bajo SSOMA → Documentos.
- Historial en la ficha del trabajador y retirada de Inventario por proyecto.
- Reutilización de Panel, HeaderPanel, Table, botones, acciones ghost y permisos.

## Restricciones

- Sin worktrees, clones, cambios de rama, reset, clean, commits ni push.
- Sin componentes UI paralelos ni nuevas dependencias.
- Sin modificar módulos de STAFF, Compras o Cotizaciones.

## Tareas

- [x] **FE-P6-01 — Requerimientos SSOMA unificados**
- [x] **FE-P6-02 — Pantallas de despacho, recepción y custodia**
- [x] **FE-P6-03 — Entrega rápida, historial y PDF**
- [x] **FE-P6-04 — Navegación y retirada de inventario por proyecto**
- [x] **FE-P6-05 — Pruebas y validación frontend**

## Verificación prevista

- Pruebas contractuales focalizadas.
- TypeScript + Vite build y ESLint focalizado.
- Revisión de rutas, permisos, acciones ghost y diff.

## Estrategia

- Ruta directa por política activa del runtime que impide delegación.
- Entrega `exception-ok`: el usuario prohíbe commits.
- Pronóstico: 900–1,400 líneas autoradas.

## Progreso y evidencia

- `npm run test:ssoma-work-clothing`: 6/6 comprobaciones correctas.
- `npm run test:inventory-ssoma`: 5/5 comprobaciones correctas.
- `npm run build`: correcto; TypeScript y Vite completaron con una advertencia de tamaño de chunk.
- ESLint focalizado: 0 errores y 9 advertencias existentes de Fast Refresh.
- Se revisaron rutas, permisos, acciones ghost y la retirada operativa del inventario por proyecto mediante pruebas contractuales y compilación.
- No se realizó validación visual real en navegador.
- No se creó commit por restricción expresa del usuario.

## Siguiente paso

Realizar una prueba funcional en navegador con usuarios de Logística y PDR, incluyendo viewport móvil y permisos reales.

## Revisión final de migración — 2026-11-19

- [x] **FE-P6-R01 — Enviar la talla al registrar stock central de Ropa de Trabajo**
- [x] **FE-P6-R02 — Verificar compilación y contrato de inventario por talla**

La revisión corrige únicamente la integración necesaria para que el backend no mezcle existencias de tallas distintas. No inicia una fase nueva ni modifica otros flujos.

### Evidencia

- El modal de ingreso central selecciona una variante activa, exige talla para
  Ropa de Trabajo y envía `elementVariantId` al backend.
- `npm run test:ssoma-work-clothing`: 7/7 comprobaciones correctas.
- `npm run build`: correcto; TypeScript y Vite completaron con la advertencia de
  tamaño de chunk ya registrada.
- ESLint focalizado del formulario y la prueba contractual: correcto.
- No se realizó validación visual en navegador.
