# Paquete SafeStart — Análisis profundo y mejoras BBS

**Sistema EHS Tornquist v2 · Refactor metodológico**
**Aplicación de SafeStart (Larry Wilson) y eliminación de duplicaciones**

---

## Resumen ejecutivo

Refactor completo basado en análisis crítico de cada tipo de evento. Cambios:

| Tipo | Quita | Agrega | Cambia |
|---|---|---|---|
| Observación | Subtipo "Casi accidente" | Estado observado SafeStart · Tipo de riesgo | — |
| Conversación | 1 subtipo (4→3) | ¿Refuerzo positivo? · ¿Propuesta propia? | "Charla preventiva" + "Diálogo 5min" → "Charla de seguridad" |
| Incidente | — | Estado mental · Error crítico SafeStart | Recibe "Casi accidente" desde Observación |
| Accidente | Notif. responsable (redundante con ART) | Estado mental · Error crítico SafeStart obligatorios | — |
| Medio Ambiente | — | Fuente del derrame · ¿Llegó a pluvial? | — |

**Total:** +14 columnas nuevas en Sheet, -1 redundancia, -1 subtipo duplicado.

---

## Archivos del paquete

| Archivo | Líneas | Qué cambió |
|---|---|---|
| `formulario_v2.html` | 921 | 4 nuevos bloques condicionales SafeStart + simplificación subtipos + review actualizado |
| `dashboard_v2.html` | 840 | Sin cambios estructurales, sigue funcionando con campos viejos y nuevos |
| `seguimiento_v2.html` | 563 | Sin cambios |
| `index.html` | 274 | Sin cambios |
| `Code_v2.gs` | actualizado | HEADERS_EVENTOS con 14 columnas nuevas + saveEvento extendido |
| `MigracionSafeStart.gs` | nuevo | Script de migración para agregar columnas al Sheet existente |

---

## Plan de deploy paso a paso

### Paso 1 — Backup primero (CRÍTICO)

Antes de tocar nada, hacé una **copia de seguridad** de la planilla "Registro SEH Tornquist v2":

1. Abrir la planilla v2.
2. Archivo → Hacer una copia → nombre "Registro SEH Tornquist v2 BACKUP 2026-04-26".
3. Confirmá que la copia tiene los mismos datos.

Si algo sale mal, restauramos desde el backup.

### Paso 2 — Actualizar Code.gs en Apps Script

1. Abrí la planilla v2.
2. Extensiones → Apps Script.
3. Buscá el archivo `Code.gs` (o como se llame el principal — el que tiene `doGet` y `doPost`).
4. Borrá todo su contenido.
5. Pegá el contenido completo de **`Code_v2.gs`** que está en outputs.
6. Guardá (Ctrl+S).
7. Implementar → Administrar implementaciones → editar la actual → Nueva versión → "v2.1 SafeStart" → Implementar.

⚠️ **Importante:** la URL del Apps Script **no cambia** — sigue siendo la misma de siempre. Solo se sube código nuevo a esa misma URL.

### Paso 3 — Agregar columnas al Sheet

1. En el editor de Apps Script de la planilla v2, click en **"Archivo nuevo"** → **"Script"** → llamalo `MigracionSafeStart`.
2. Pegá el contenido de **`MigracionSafeStart.gs`**.
3. Guardá.
4. Seleccioná la función `agregarColumnasSafeStart` en el desplegable de funciones.
5. Click en "Ejecutar".
6. La primera vez te va a pedir permisos — aceptá.
7. Después de unos segundos vas a ver un mensaje "Migración completada ✓" con la lista de 14 columnas agregadas.
8. Andá a la planilla → hoja Eventos → scrolleá a la derecha hasta el final. Vas a ver las columnas nuevas vacías (correcto — los datos viejos no las tienen).

**Si ya existían las columnas (caso raro):** el script avisa "ya existen" y no hace nada. Es idempotente.

**Si algo salió mal:** ejecutá `revertirMigracionSafeStart()` desde el mismo archivo. Borra las 14 columnas y deja todo como estaba.

### Paso 4 — Subir frontend al branch v2

1. Ir a GitHub, branch v2.
2. Subir los 3 archivos HTML actualizados (reemplazando los actuales):
   - `formulario_v2.html` (921 líneas)
   - `dashboard_v2.html` (840 líneas)
   - `seguimiento_v2.html` (563 líneas)
3. Commit: `"v2.1: SafeStart + análisis BBS profundo"`.
4. Esperar deploy automático en Digital Ocean (~2 min).

### Paso 5 — Probar 1 evento de cada tipo

Antes de invitar a Zanotto y al equipo, validá vos:

1. **Observación con Acto inseguro:**
   - Verificar que el subtipo "Casi accidente" YA NO aparece.
   - Marcar Acto inseguro → ver bloque azul "Conversación con la persona".
   - Marcar un estado observado (ej: Prisa).
   - Marcar causa probable.
   - Avanzar al review → ver que aparece "Estado observado (SafeStart)".
   - Enviar → verificar en hoja Eventos que las columnas nuevas tienen los valores cargados.

2. **Observación con Condición insegura:**
   - Verificar bloque ámbar.
   - Marcar tipo de riesgo (ej: Mecánico).
   - Verificar que se guarda.

3. **Conversación:**
   - Ver que ahora hay solo 3 subtipos (Refuerzo positivo, Coaching correctivo, Charla de seguridad).
   - Ver bloque verde "Calidad de la conversación".
   - Marcar ambos campos.

4. **Incidente:**
   - Ver que ahora aparece "Casi accidente / cuasi accidente" como primer subtipo.
   - Ver bloque violeta "Análisis SafeStart" al final.
   - Marcar estado mental + error crítico.

5. **Accidente:**
   - Ver que el campo "Notif. responsable" ya no aparece.
   - Ver bloque violeta "Análisis SafeStart" obligatorio.
   - Marcar los dos campos.

6. **Medio Ambiente:**
   - Ver que ahora hay campo "Fuente del derrame/fuga" con chips.
   - Ver "¿Llegó a desagüe pluvial o cuerpo de agua?" con 4 opciones.

### Paso 6 — Validar en Sheet

Abrí la hoja Eventos y andá a la fila de los 6 eventos que cargaste. Las columnas nuevas (al final) deben tener los valores correctos. Si alguna quedó vacía cuando debería tener valor, hay un bug — avisame.

---

## Cambios metodológicos: por qué cada uno

### Por qué quitar "Casi accidente" de Observación

Una observación es **proactiva** (veo algo antes que pase). Un casi accidente es **retroactivo** (algo ya pasó pero por suerte no hubo lesión). Mezclarlos genera datos inconsistentes y rompe los KPIs (la "pirámide de Heinrich" que mostramos en el dashboard se calcula contando estos eventos por separado).

### Por qué SafeStart en Incidente y Accidente

Larry Wilson (creador de SafeStart, 25+ años de experiencia, 3 millones de personas entrenadas en 60+ países) dice textualmente: *"Cada vez que cometés un error, aunque sea solo un casi-incidente o una pequeña lesión, preguntate: ¿esto fue causado por algún estado como prisa, frustración o fatiga?"*.

El 90-95% de los accidentes laborales tienen un estado mental detrás. Capturarlo sistemáticamente te permite detectar patrones (ej: "el 70% de los incidentes en Pulper son por Prisa los lunes a la mañana") y atacar la causa raíz, no solo el síntoma.

### Por qué simplificar Conversación a 3 subtipos

"Charla preventiva" y "Diálogo 5 minutos" se solapaban conceptualmente (ambas son charlas espontáneas o programadas sobre un tema de seguridad). Tener subtipos solapados hace que la gente cargue mal y los datos pierden poder analítico. Mejor tener menos opciones bien diferenciadas.

### Por qué agregar calidad BBS en Conversación

SafeStart enseña que una buena conversación BBS:
1. Empieza con reconocimiento positivo (la persona se predispone a escuchar).
2. Hace que la persona **descubra** la mejora (no se la imponen).

Estos dos campos te permiten medir **calidad** de las conversaciones, no solo cantidad. Con el tiempo podés agregar un KPI "% de conversaciones con refuerzo positivo" como indicador de madurez del programa.

### Por qué quitar Notif. responsable en Accidente

Un Accidente real **siempre** se notifica al responsable. Que el campo sea opcional no tiene sentido. La Notif. ART ya cubre la parte formal/legal. Si el responsable no se notificó automáticamente con la ART, eso es un problema de proceso, no algo a registrar como un campo más.

### Por qué fuente y desagüe pluvial en Medio Ambiente

- **Fuente** (cañería/tanque/válvula/transferencia/tambor): orienta el plan de acción correctiva. Una fuga de cañería implica revisión de mantenimiento; una de tambor implica capacitación en manipulación. Sin este dato, la acción correctiva genérica nunca ataca la causa.
- **¿Llegó a pluvial?**: cambia radicalmente la severidad ambiental y la obligación legal de notificar a la autoridad (OPDS provincia Buenos Aires). Si llegó a un cuerpo de agua, hay 24 hs para notificar. Si quedó contenido en planta, solo registro interno.

---

## Cosas que NO cambiaron (intencionalmente)

- ✅ Subtipos de Accidente (perfectos, alineados a SRT 84/2012).
- ✅ Subtipos de Medio Ambiente (alineados a Ley 25.675).
- ✅ Validaciones del formulario (5 pasos, descripción ≥10 chars, etc.).
- ✅ Autocompletado persona ↔ legajo.
- ✅ Banner inspiracional no-punitivo.
- ✅ 5 leading KPIs del dashboard (siguen siendo válidos).
- ✅ Lectura de Maestros desde Sheet vía API.

---

## Próximos pasos sugeridos

Después de validar este paquete:

**Inmediato:** dejar correr 2-3 semanas con el equipo y acumular datos SafeStart reales.

**Paquete F (Loops de feedback):**
- Email automático al reportador cuando se cierra acción derivada.
- Pantalla pública con auto-refresh.
- KPIs nuevos en dashboard:
  - Distribución de estados SafeStart (heatmap)
  - Top 3 errores críticos del mes
  - % conversaciones con refuerzo positivo

**Más adelante (Fase 2 — Fotos):**
- Carga de foto desde celular en formulario y al cerrar acciones.
- Subida a Drive con compresión.
- Visor inline en dashboard.

---

## Material para tu reunión semanal

Te sugiero presentar SafeStart al equipo en la reunión de seguridad. Texto sugerido:

> *"Vamos a empezar a registrar el estado mental detrás de cada incidente y accidente. SafeStart, la metodología más usada del mundo en seguridad, dice que el 90% de los accidentes tiene un estado mental detrás: prisa, frustración, fatiga o complacencia. No vamos a juzgar a nadie por estar apurado o cansado — somos personas, todos pasamos por eso. Pero si aprendemos a reconocer cuándo estamos en uno de esos estados, podemos pausar 5 segundos y evitar el accidente. Eso es lo que vamos a empezar a registrar. Si reportás un casi accidente, dale 30 segundos a pensar: ¿en qué estado mental estaba? Esa información va a salvar al próximo compañero."*

Si querés, te armo una **slide visual de 1 página** explicando los 4 estados y los 4 errores críticos, lista para imprimir y dejar en el Asakai. Avisame.
