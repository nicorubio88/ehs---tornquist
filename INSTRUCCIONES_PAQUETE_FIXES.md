# Paquete Fixes + Mejoras — EHS Tornquist v2

**6 cambios en un solo paquete:** 3 bugs corregidos + 3 mejoras nuevas.

---

## Lo que cambió

### 🔴 Bug 1 — Error "Subtipo inválido para CONVERSACION: Charla de seguridad"
**Causa:** los `SUBTIPOS` del formulario y del backend estaban desincronizados. El formulario mandaba `"Charla de seguridad"`, el backend esperaba `"Charla preventiva"` o `"Diálogo 5 minutos"`.

**Fix:** sincronicé los SUBTIPOS del backend con los del formulario. Ahora coinciden exactamente:
- OBSERVACION: `Acto inseguro`, `Condición insegura`
- CONVERSACION: `Refuerzo positivo`, `Coaching correctivo`, `Charla de seguridad`
- INCIDENTE: `Casi accidente / cuasi accidente`, `Daño material`, `Falla equipo con riesgo`
- ACCIDENTE: `Lesión leve sin baja`, `Lesión leve con baja`, `Lesión grave`, `Fatal`
- AMBIENTE: `Derrame`, `Fuga gas/vapor`, `Emisión no controlada`, `Residuo mal gestionado`, `Ruido fuera de norma`

**Archivo:** `Code_v2.gs`

---

### 🔴 Bug 2 — Modal "Cerrar acción" sin nombres
**Causa:** el modal listaba solo `MAESTROS.responsables`, que son los 5 jefes de Maestros cargados sin legajo. La lista venía prácticamente vacía.

**Fix:** ahora el modal lista **todos los responsables + todo el personal** con un input de búsqueda en vivo, igual que en el dashboard cuando creás una nueva acción. Los responsables aparecen primero marcados con ★.

**Archivo:** `seguimiento_v2.html`

---

### 🔴 Bug 3 — No se ve el detalle de la acción en Seguimiento
**Causa:** en el módulo de Seguimiento no había forma de abrir el detalle del evento asociado a cada acción (sí estaba en el Dashboard).

**Fix:** agregué botón **"👁 Ver evento"** en cada card de acción. Abre un modal con:
- ID del evento + tipo + subtipo
- Fecha, sector, turno, reportador, prioridad, persona involucrada
- Descripción completa
- Foto (si tiene), clickeable para abrirla en grande

**Archivo:** `seguimiento_v2.html`

---

### 🟡 Mejora 4 — Ranking del dashboard: top 5 + desplegable
**Antes:** mostraba 15 personas, después había que clickear "Ver todas".

**Ahora:** muestra solo top 5 inicialmente, con botón "▼ Ver las N personas" para expandir. Más limpio, menos scroll.

**Archivo:** `dashboard_v2.html`

---

### 🟢 Mejora 5 — Curva de Bradley
**Nueva sección** que muestra en qué **etapa de madurez cultural** está la planta. 4 etapas con cálculo automático:

| # | Etapa | Criterio |
|---|---|---|
| 1 | Reactiva | Bajo ratio, baja participación de operarios |
| 2 | Dependiente | Hay reportes pero impulsados por supervisión |
| 3 | Independiente | Ratio ≥50:1 y ≥50% operarios reportando |
| 4 | Interdependiente | Ratio ≥100:1, ≥70% operarios + hay conversaciones |

Visualmente: barra de 4 segmentos coloreados con la etapa actual destacada + métricas de soporte (ratio obs/accid, % reportes operarios) + razón del cálculo.

**Archivo:** `dashboard_v2.html`

---

### 🟢 Mejora 6 — Target de eventos por persona (fijo + dinámico)
**Nueva sección** que muestra el objetivo de eventos/persona/mes para sostener la cultura BBS. Tiene **toggle Fijo/Dinámico**:

- **Fijo:** 4 eventos/persona/mes (piso recomendado para arrancar BBS)
- **Dinámico:** calculado como `(accidentes últimos 12m × 100) / 12 meses / dotación`. Mantiene la lógica del ratio 100:1.

Con tus datos actuales (51 personas, 1 accidente en 12 meses) el dinámico calcula 0.16/persona/mes, pero el sistema lo eleva al piso de 4 porque por debajo no tiene sentido. **Si los accidentes aumentaran, el dinámico se ajustaría solo.**

La selección se persiste en localStorage por navegador.

También muestra **% de cumplimiento del mes**: cuántas personas alcanzaron el target.

**Archivo:** `dashboard_v2.html`

---

## Archivos a subir

| Archivo | Cambios |
|---|---|
| `Code_v2.gs` | Bug 1 (subtipos sincronizados) |
| `dashboard_v2.html` | Mejoras 4, 5, 6 + el conversacionesMes para Bradley |
| `seguimiento_v2.html` | Bugs 2 y 3 |
| `formulario_v2.html` | Sin cambios (ya estaba bien — confirmado) |

---

## Tests aplicados (todos pasaron)

✅ Sintaxis JS de los 4 archivos
✅ SUBTIPOS del formulario están todos en el backend
✅ Modal de cierre tiene input de búsqueda + lista MAESTROS.personal + select tamaño 6
✅ Botón "Ver evento" + función abrirDetalleEvento con foto/descripción
✅ Ranking limitado a 5 con botón expandir
✅ Bradley: las 4 etapas + cálculo + insertado en render
✅ Target: fijo y dinámico + toggle + localStorage + insertado en render
✅ Cálculo de Bradley con datos reales tipo Tornquist: detecta etapa 3 (Independiente)
✅ Cálculo de Target dinámico: con 1 accidente/año + 51 personas → respeta piso de 4
✅ render() completo no rompe ningún cálculo previo

---

## Plan de deploy

1. **Backup:** Archivo → Hacer una copia de la planilla v2 antes de cambiar Code.gs
2. **Code.gs:** pegar `Code_v2.gs` → Implementar → Nueva versión "v2.6 fixes+mejoras"
3. **HTMLs:** subir `dashboard_v2.html` y `seguimiento_v2.html` al branch v2 de GitHub
4. Esperar deploy automático en Digital Ocean (~2 min)
5. Probar en este orden:
   - Cargar una Conversación con subtipo "Charla de seguridad" → debe guardar sin error
   - Cerrar una acción desde Seguimiento → ver la lista con búsqueda
   - Click en "Ver evento" en una acción → ver el detalle del evento
   - Dashboard: ranking arranca con 5 personas
   - Dashboard: aparece la curva de Bradley con etapa marcada
   - Dashboard: aparece la sección Target con toggle Fijo/Dinámico

---

## Nota sobre Bradley + Target

Con tus datos actuales el sistema te va a posicionar en **etapa 3 (Independiente)** porque tenés un ratio muy alto de observaciones por accidente y la participación de operarios es buena. La etapa 4 (Interdependiente) requiere además que haya **conversaciones de seguridad** activas regulares, no solo observaciones.

Esto te marca el camino: si querés llegar a Bradley 4, tenés que **activar el uso del tipo "Conversación"** en el formulario. Hoy en la planta el equipo reporta mucha observación pero pocas conversaciones (eso explica también por qué el error de Bug 1 era tan visible — el equipo intentaba cargar Conversaciones y no podía).

Después de este deploy, las conversaciones van a poder cargarse sin error y el indicador de Bradley va a empezar a moverse hacia el 4.
