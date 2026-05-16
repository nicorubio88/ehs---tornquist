# Paquete Acción Correctiva Integrada

**Sistema EHS Tornquist v2 · Update**
**Limpieza de doble pregunta + bloque de acción correctiva integrado al formulario**

---

## Lo que cambió

### Problema detectado (de tus screenshots)
1. En Observación, el paso 3 volvía a preguntar "Tipo de acto/condición" cuando ya se había elegido en paso 0 como subtipo
2. El bloque "Orden de trabajo a Mantenimiento" no era lo que necesitabas — pediste reemplazarlo por "Tarjeta de aviso de riesgo"
3. Faltaba poder cargar la acción correctiva (descripción, prioridad, fecha cierre, responsable) directamente al cargar el evento

### Solución aplicada

**1. Doble pregunta eliminada.** El subtipo elegido en paso 0 ahora se respeta. En el paso 3, en lugar de un dropdown duplicado, mostramos un badge con el subtipo ya elegido.

**2. "Orden de trabajo" reemplazada por "Tarjeta de aviso de riesgo".** Es Sí/No/No corresponde + un campo opcional de N° de tarjeta que aparece solo si elegiste "Sí".

**3. Nuevo bloque "Acción correctiva (opcional)"** aparece en 3 tipos:
- Observación con subtipo "Condición insegura"
- Incidente (cualquier subtipo)
- Medio Ambiente (cualquier subtipo)

El bloque tiene 4 campos opcionales: Acción necesaria, Prioridad (Alta/Media/Baja), Fecha de cierre, Responsable (dropdown con todos los responsables + personal).

**Si llenás "Acción necesaria" se crea automáticamente la acción correctiva** asignada al responsable elegido. Aparece al instante en "Mis pendientes" del responsable y en el módulo Seguimiento. Si dejás el campo vacío, queda solo el evento registrado sin acción asociada.

### Tipos donde NO aparece el bloque (a propósito)
- **Observación / Acto inseguro:** un acto inseguro se aborda con conversación, no con acción correctiva. Si querés generar acción correctiva, cargá el evento como Incidente.
- **Conversación:** la conversación es la acción en sí misma.
- **Accidente:** se carga primero el evento (urgencia legal y médica), las acciones correctivas surgen de la investigación posterior. Las podés crear desde el dashboard al abrir el evento.

---

## Archivos del paquete

| Archivo | Líneas | Cambios |
|---|---|---|
| `formulario_v2.html` | 1062 | Quitada doble pregunta, agregada tarjeta de aviso, bloque acción correctiva |
| `Code_v2.gs` | actualizado | `saveEvento` ahora crea acción al recibir `accion_descripcion`. Agregadas 3 columnas a HEADERS_ACCIONES (prioridad, creada_por_*) |
| `dashboard_v2.html` | 1700 | Sin cambios |
| `seguimiento_v2.html` | 602 | Sin cambios |

---

## Plan de deploy

### Paso 1 — Backup
1. Hacé copia de la planilla v2 → "Registro SEH Tornquist v2 BACKUP 2026-05-16"

### Paso 2 — Actualizar Code.gs en Apps Script
1. Abrir Apps Script de la planilla v2
2. Reemplazar todo el contenido de `Code.gs` por el nuevo `Code_v2.gs`
3. Guardar
4. Implementar → Administrar implementaciones → editar la actual → Nueva versión → "v2.3 Acción integrada" → Implementar

### Paso 3 — Agregar columnas nuevas a la hoja Acciones
La función `saveAccionInterna` necesita 3 columnas nuevas al final de la hoja Acciones:
- `prioridad`
- `creada_por_legajo`
- `creada_por_nombre`

**Opción A (manual):** abrir la planilla, hoja Acciones, ir a la última columna y agregar 3 nuevos headers con esos nombres.

**Opción B (automático):** Apps Script crea las columnas automáticamente la primera vez que llamás a `getOrCreateSheet` con el nuevo HEADERS_ACCIONES. Si la hoja ya tiene headers más cortos, hay que **agregar manualmente** las 3 columnas faltantes al final.

Verificá ejecutando `verEstructuraEventos` (del archivo MigracionSafeStart) — debería mostrar la hoja Acciones también si la modificás.

### Paso 4 — Agregar columna al Sheet de Eventos
Los campos nuevos (`obs_tarjeta_aviso`, `obs_nro_tarjeta`, `accion_*`) viajan al backend pero los `accion_*` se usan **solo para crear la acción**, no se guardan en la hoja Eventos. Sí necesitás agregar manualmente al final de la hoja Eventos:
- `obs_tarjeta_aviso`
- `obs_nro_tarjeta`

### Paso 5 — Subir HTMLs al branch v2 de GitHub
1. Reemplazar `formulario_v2.html` con la nueva versión (1062 líneas)
2. Commit: `"v2.3: acción correctiva integrada al formulario"`
3. Esperar deploy en Digital Ocean (~2 min)

### Paso 6 — Probar

#### Test 1 — Sin doble pregunta
1. Abrir formulario → elegir "Observación" → subtipo "Condición insegura"
2. Avanzar hasta paso 3 (Detalles)
3. Verificar que NO aparece dropdown "Tipo de acto/condición"
4. Verificar que SÍ aparece un badge "Subtipo elegido: Condición insegura"

#### Test 2 — Tarjeta de aviso de riesgo
1. Mismo escenario que test 1
2. Verificar que aparece "¿Se generó tarjeta de aviso de riesgo?" con chips Sí/No/No corresponde
3. Click "Sí" → debería aparecer un campo de texto "N° de tarjeta"
4. Escribir un número
5. Click "No" → el campo de N° de tarjeta debería desaparecer

#### Test 3 — Acción correctiva integrada en Condición insegura
1. Mismo escenario
2. Bajar hasta ver el bloque verde "📋 Acción correctiva (opcional)"
3. Completar:
   - Acción necesaria: "Cambiar protección de transmisión"
   - Prioridad: "Alta"
   - Fecha de cierre: en 7 días
   - Responsable: elegir alguien de la lista
4. Avanzar al paso 4 (Revisión) → verificar que aparece la sección "📋 Acción correctiva a crear" con todos los datos
5. Click en "Enviar"
6. Verificar pantalla de éxito: aparece un cuadro verde "📋 Acción correctiva creada"
7. Verificar en la hoja Eventos que se guardó el evento
8. Verificar en la hoja Acciones que se guardó la acción nueva con prioridad y creada_por
9. Ir al dashboard → si elegiste tu propia identidad como responsable, debería aparecer en "Mis pendientes"

#### Test 4 — Sin acción correctiva (campo vacío)
1. Mismo flujo pero NO llenar "Acción necesaria"
2. Enviar
3. Verificar que SÍ se guardó el evento
4. Verificar que NO se creó ninguna acción correctiva en la hoja Acciones
5. La pantalla de éxito no muestra el cuadro verde de "acción creada"

#### Test 5 — Incidente también tiene acción correctiva integrada
1. Cargar un Incidente
2. Verificar bloque verde al final
3. Llenar y enviar → se debe crear acción asignada

#### Test 6 — Medio Ambiente también
1. Cargar un evento ambiental
2. Verificar bloque verde al final
3. Llenar y enviar → se debe crear acción asignada

#### Test 7 — Acto inseguro NO tiene bloque de acción
1. Cargar Observación con subtipo "Acto inseguro"
2. Verificar que aparece el bloque de Análisis SafeStart pero NO el de Acción correctiva
3. (Razón: actos inseguros se abordan con conversación, no con acción correctiva directa)

#### Test 8 — Conversación y Accidente NO tienen bloque
1. Verificar que ninguno de estos dos muestra el bloque verde

---

## Beneficio para el equipo

**Antes:** cargabas un evento → ibas al dashboard → click en el evento → click "Nueva acción correctiva" → completabas → guardabas. 5 pasos.

**Ahora:** cargás un evento + acción en el mismo flujo. 1 paso integrado.

Y como mejora cultural: la acción aparece inmediatamente en "Mis pendientes" del responsable asignado. Si Zanotto cargó una condición insegura en el sector pulper y te asignó a vos como responsable, vos ves la acción al instante con su prioridad y fecha de cierre, sin necesidad de pasarle por mail o WhatsApp el detalle.

---

## Tests aplicados antes de entregar

8 tests funcionales, todos pasaron:
- Sintaxis JS correcta en los 3 archivos
- Observación Condición insegura: muestra tarjeta + acción correctiva, NO muestra doble pregunta, NO muestra OT mantenimiento
- Observación Acto inseguro: muestra SafeStart, NO muestra acción correctiva
- Incidente: muestra acción correctiva
- Ambiente: muestra acción correctiva
- Conversación: NO muestra acción correctiva
- Accidente: NO muestra acción correctiva
- setAccionResponsable: asigna nombre y legajo correctamente
- state.form tiene todos los campos nuevos inicializados

---

## Próximos pasos

Después de validar este paquete:
- **Email automático al reportador** cuando se cierra una acción derivada de su reporte
- **Pantalla pública** modo kiosco
- **KPIs SafeStart en dashboard**

Avisame cómo sale el deploy.
