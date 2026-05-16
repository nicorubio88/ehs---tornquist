# Paquete Coherencia + Asignación de Acciones

**Sistema EHS Tornquist v2 · Update**
**Tres mejoras en un solo paquete: personal nuevo, coherencia Obs/Conv, asignación de acciones**

---

## Lo que cambió en este paquete

### Cambio 1 — 51 personas nuevas en Maestros
Sumás las personas del archivo DOTACION_FC al sistema. El script detecta duplicados por legajo o nombre, no rompe nada si ya estaban cargadas.

### Cambio 2 — Coherencia Observación vs Conversación
Quitamos dos campos redundantes de Observación que generaban confusión:
- "¿Hablaste con la persona?" → si hablaste, va como Conversación
- "Acción inmediata tomada" → estaba duplicado con los bloques condicionales

Agregamos pregunta de ruteo al inicio del formulario que orienta al usuario al tipo correcto. Y agregamos campo "¿Surgió de una observación previa?" en Conversación para vincular conceptualmente.

### Cambio 3 — Asignación de acciones + Mis Pendientes
Tres mejoras de productividad para el equipo:
- **Dropdown ampliado** al crear una acción: ahora podés asignar a cualquier persona del Personal (no solo Responsables) con búsqueda en vivo
- **Nueva sección "Mis pendientes"** en el dashboard: cada persona elige su identidad una vez, queda guardada en el navegador, y ve solo sus acciones pendientes con badges de urgencia
- **Filtro "Solo mis acciones"** en seguimiento: aparece automáticamente si ya elegiste tu identidad en el dashboard

---

## Archivos del paquete

| Archivo | Líneas | Cambios |
|---|---|---|
| `AgregarPersonalDotacion.gs` | nuevo | Script de Apps Script para sumar 51 personas a Maestros |
| `formulario_v2.html` | 948 | Pregunta de ruteo, quitar campos redundantes, agregar conv_origen |
| `dashboard_v2.html` | 1700 | Nueva sección "Mis pendientes" + dropdown asignación ampliado |
| `seguimiento_v2.html` | 602 | Toggle "Solo mis acciones" |
| `Code_v2.gs` | actualizado | Columna `conv_origen` agregada a HEADERS_EVENTOS |

---

## Plan de deploy paso a paso

### Paso 0 — Backup primero
1. Abrir la planilla "Registro SEH Tornquist v2"
2. Archivo → Hacer una copia → nombre "Registro SEH Tornquist v2 BACKUP 2026-05-15"
3. Verificar que la copia tiene los mismos datos

### Paso 1 — Agregar las 51 personas a Maestros

1. Abrí la planilla v2.
2. Extensiones → Apps Script.
3. Click en **"Archivo nuevo"** → **"Script"** → llamalo `AgregarPersonalDotacion`.
4. Pegá el contenido completo de `AgregarPersonalDotacion.gs`.
5. Guardá (Ctrl+S).
6. Seleccioná la función `agregarPersonalDotacion` en el desplegable de funciones.
7. Click en "Ejecutar".
8. La primera vez te pedirá permisos. Aceptá.
9. Vas a ver un alert con un resumen:
   - "Agregadas: X personas"
   - "Ya existían (por legajo): Y"
   - "Ya existían (por nombre): Z"

**Resultado esperado:** se agregan entre 45 y 51 personas (algunas como Issaly, Stoessel, Vallejos, Zanotto, Gamero, Cabrera probablemente ya estaban como responsables y se detectan como duplicados).

### Paso 2 — Actualizar Code.gs

1. En el editor de Apps Script, abrí el archivo principal `Code.gs` (el que tiene `doGet` y `doPost`).
2. Borrá todo su contenido.
3. Pegá el contenido completo de `Code_v2.gs` que está en outputs.
4. Guardá.
5. Implementar → Administrar implementaciones → editar la actual → Nueva versión → "v2.2 Coherencia + Asignación" → Implementar.

⚠️ La URL del Apps Script **no cambia**.

### Paso 3 — Agregar columna `conv_origen` a la hoja Eventos

Esto es necesario para que el campo nuevo de Conversación se guarde correctamente.

**Opción A — Manual (recomendada):**
1. Andá a la planilla, hoja Eventos.
2. Scrolleá a la derecha hasta la última columna.
3. En la celda de header (fila 1) de la siguiente columna libre, escribí: `conv_origen`
4. Listo.

**Opción B — Apps Script:**
Si querés que el script detecte y agregue automáticamente, podés ejecutar `verEstructuraEventos()` del archivo `MigracionSafeStart.gs` para ver la estructura actual, y agregar la columna manualmente al final.

### Paso 4 — Subir HTMLs al branch v2 de GitHub

1. Ir a GitHub, branch v2.
2. Reemplazar los 3 archivos actuales con los nuevos:
   - `formulario_v2.html` (948 líneas)
   - `dashboard_v2.html` (1700 líneas)
   - `seguimiento_v2.html` (602 líneas)
3. Commit: `"v2.2: coherencia Obs/Conv + Mis Pendientes + asignación ampliada"`
4. Esperar deploy automático en Digital Ocean (~2 min).

### Paso 5 — Probar (orden sugerido)

#### Test 1 — Pregunta de ruteo en formulario
1. Abrir el formulario en una pestaña nueva (Ctrl+F5 para limpiar cache).
2. Antes de elegir tipo, deberías ver el bloque azul "🧭 Te ayudo a elegir" con 5 opciones de ruteo.
3. Click en "Sí — hablé con alguien" → debería seleccionar automáticamente "CONVERSACION".
4. Click en "No — vi pero no hablé" → debería seleccionar "OBSERVACION".
5. Una vez elegido el tipo, el bloque azul desaparece (no se repite).

#### Test 2 — Observación limpia
1. Elegir tipo "Observación", subtipo "Acto inseguro".
2. Verificar que **NO** aparece el campo "¿Hablaste con la persona?"
3. Verificar que **NO** aparece "Acción inmediata tomada" en el bloque base.
4. Verificar que sí aparece el tip amarillo: "Si conversaste con la persona involucrada, mejor cargá una Conversación".
5. El bloque azul "Análisis del acto" (SafeStart + Causa) sigue apareciendo correctamente.

#### Test 3 — Conversación con origen
1. Elegir tipo "Conversación".
2. Primer campo nuevo: "¿Surgió de una observación previa?" con chips Sí/No.
3. Marcar "Sí" o "No" según corresponda.
4. Avanzar al review → verificar que aparece "Surgió de observación previa: Sí/No".
5. Enviar el evento → verificar en hoja Eventos que la columna `conv_origen` se llenó.

#### Test 4 — Asignación de acción con búsqueda
1. En el dashboard, abrir cualquier evento.
2. Click en "+ Nueva acción correctiva".
3. En el modal, verificar:
   - Hay un campo de búsqueda arriba ("Buscar por nombre o legajo...")
   - Hay una lista grande (size=6) con TODAS las personas del sistema
   - Los responsables aparecen primero, marcados con ★
   - El resto del personal aparece después
4. Escribir "Bauer" en la búsqueda → la lista filtra en vivo.
5. Limpiar el campo → todos vuelven a aparecer.
6. Elegir una persona, completar descripción, guardar.
7. Verificar en la hoja Acciones que se guardó con `responsable_legajo` y `responsable_nombre` correctos.

#### Test 5 — Mis Pendientes
1. Abrir el dashboard. La primera sección que vas a ver es la naranja "Mis pendientes".
2. Si es la primera vez: aparece el mensaje "¿Quién sos?" con búsqueda y lista.
3. Buscar tu nombre → seleccionarte → la sección cambia y muestra:
   - Tu nombre arriba con un botón "Cambiar"
   - Acciones asignadas a vos (si hay)
   - Si no hay acciones: mensaje verde "No tenés acciones pendientes"
4. Recargar la página → debe seguir mostrando tu identidad (queda guardada en localStorage del navegador).
5. Si tenés acciones, verificar que las que vencieron tienen badge rojo "Venció hace X días".
6. Click en "✓ Cerrar" → confirmación → la acción desaparece de tu lista.

⚠️ **Importante:** Mis Pendientes funciona por **navegador**, no por usuario logueado. Si una persona usa el sistema desde 2 dispositivos (ej: celular y PC), tiene que elegir su identidad en cada uno. Si limpia el cache del navegador, pierde la identidad.

#### Test 6 — Filtro "Solo mis acciones" en seguimiento
1. Después de elegir identidad en el dashboard, abrir el módulo de Seguimiento.
2. Arriba de los filtros, verás el botón "👤 Solo mis acciones" con tu nombre al lado.
3. Click → se activa (cambia a verde) y filtra solo tus acciones.
4. Click de nuevo → se desactiva.
5. Si limpiás identidad en el dashboard, en seguimiento verás un tip amarillo que dice "💡 Tip: Elegí tu identidad en el Dashboard para filtrar tus acciones."

---

## Para presentar al equipo en la reunión semanal

Te sugiero comunicar estos cambios al equipo. Texto sugerido:

> "Hicimos varias mejoras al sistema EHS esta semana. Tres cosas importantes:
> 
> Primero, sumamos 50 personas nuevas al sistema, así si tenés un compañero del sector que reportar o asignar como responsable de una acción, lo vas a encontrar.
> 
> Segundo, ahora cada uno tiene su propia bandeja de 'Mis pendientes' en el dashboard. Entran al dashboard, eligen su nombre una vez, y ven directamente las acciones que les fueron asignadas. Si están vencidas, aparecen en rojo. Si vencen pronto, en amarillo. Y desde ahí mismo las pueden cerrar con un click.
> 
> Tercero, cuando creemos una acción correctiva, ahora podemos asignársela a cualquier persona del Personal, no solo a los Responsables. Esto nos permite distribuir mejor el trabajo. Por favor, cuando creen una acción, asegúrense de elegir a la persona correcta — si no, la persona equivocada va a recibir la pendiente."

---

## Próximos pasos sugeridos

Después de este paquete, los temas que quedan pendientes (Paquete F del plan original):

1. **Email automático al reportador** cuando se cierra una acción derivada de su reporte (cierre del loop de feedback BBS).
2. **Pantalla pública** (publico.html) con auto-refresh, modo kiosco, sin login — para proyectar/imprimir si en algún momento conseguís un TV o tablet.
3. **KPIs nuevos en dashboard** aprovechando los datos SafeStart acumulados (distribución de estados mentales, top errores críticos del mes).

Cuando termines de probar este paquete y veas cómo el equipo lo recibe, encaramos el F.

---

## Tests aplicados

Validado antes de entregar:
- ✅ Sintaxis JS OK en los 3 HTMLs (formulario 948 / dashboard 1700 / seguimiento 602 líneas)
- ✅ Los 5 tipos de evento renderean los 5 pasos sin errores
- ✅ Bloques condicionales (Acto inseguro, Condición insegura) OK
- ✅ Mis Pendientes: 8 escenarios pasaron (identidad inicial vacía, guardar/persistir en localStorage, match por legajo, match por nombre case-insensitive, cálculo días al vencimiento, limpiar identidad, render con identidad, render sin identidad)
- ✅ Sanitización XSS aplicada a todos los puntos de inyección nuevos
- ✅ Match flexible legajo/nombre alineado con la lógica de Participación del equipo (consistencia entre secciones del dashboard)
