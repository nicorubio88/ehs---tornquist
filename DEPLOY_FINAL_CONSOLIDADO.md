# Deploy final consolidado — EHS Tornquist v2

**Fecha:** 20 de mayo 2026
**Este paquete consolida TODAS las mejoras en 4 archivos coherentes y testeados.**

---

## Qué incluye esta versión (todo junto)

Durante las últimas sesiones se desarrollaron features en ramas separadas que NUNCA estuvieron juntas en producción. Esta versión las fusiona TODAS:

| Feature | Dónde | Estado |
|---|---|---|
| Pregunta de ruteo (¿hubo conversación?) | formulario | ✅ |
| SafeStart en Incidente y Accidente | formulario + backend | ✅ |
| Conversación 3 subtipos + conv_origen | formulario + backend | ✅ |
| Tarjeta de aviso de riesgo + N° tarjeta | formulario + backend | ✅ |
| Acción correctiva integrada | formulario + backend | ✅ |
| **Foto en Condición insegura + Ambiente** | formulario + backend + dashboard | ✅ |
| Compresión automática de foto (1280px) | formulario | ✅ |
| Mis Pendientes (con localStorage) | dashboard | ✅ |
| Asignación con búsqueda en vivo | dashboard | ✅ |
| Fix KPI "Reportes de operarios" (era 100%, ahora correcto) | dashboard | ✅ |
| Detección robusta de supervisores (4 métodos) | dashboard | ✅ |
| Toggle "Solo mis acciones" | seguimiento | ✅ |

---

## Archivos a subir

| Archivo | Líneas | Dónde va |
|---|---|---|
| `formulario_v2.html` | 1186 | GitHub branch v2 |
| `dashboard_v2.html` | 1766 | GitHub branch v2 |
| `seguimiento_v2.html` | 602 | GitHub branch v2 |
| `Code_v2.gs` | 794 | Apps Script (reemplaza Code.gs) |

---

## Plan de deploy (en orden)

### Paso 0 — Backup
Archivo → Hacer una copia de la planilla v2 → "BACKUP 2026-05-20"

### Paso 1 — Agregar columnas al Sheet

El `Code_v2.gs` ahora maneja **61 columnas** en Eventos. Tu Sheet tenía 44. Hay que agregar las que faltan.

**La forma más segura:** usá el script `AuditarYFixSheet.gs` (de la auditoría anterior) que agrega automáticamente las columnas faltantes. Pero ahora son 17 columnas (las 15 de SafeStart + las 2 de tarjeta).

**Columnas que deben existir en la hoja Eventos** (al final, en este orden):
```
obs_hablo_persona, obs_causa_acto, obs_estado_observado,
obs_genera_ot, obs_parada_equipo, obs_tipo_riesgo,
conv_refuerzo_positivo, conv_propuesta_propia, conv_origen,
inc_estado_mental, inc_error_critico,
acc_estado_mental, acc_error_critico,
amb_fuente, amb_llego_pluvial,
obs_tarjeta_aviso, obs_nro_tarjeta
```

**Columnas que deben existir en la hoja Acciones** (al final):
```
prioridad, creada_por_legajo, creada_por_nombre
```

> Nota: `foto_url` ya existe en tu Sheet (posición 13 de Eventos), no hay que agregarla.

### Paso 2 — Actualizar Code.gs
1. Apps Script → reemplazar TODO el contenido de Code.gs por el nuevo `Code_v2.gs`
2. Guardar
3. Implementar → Administrar implementaciones → Nueva versión → "v2.5 Consolidado + Fotos" → Implementar
4. **IMPORTANTE:** la primera vez que se suba una foto, Apps Script pedirá permiso de acceso a Google Drive. Aceptá. Es porque ahora crea carpetas/archivos en tu Drive.

### Paso 3 — Subir HTMLs a GitHub
1. Reemplazar los 3 archivos en el branch v2:
   - `formulario_v2.html`
   - `dashboard_v2.html`
   - `seguimiento_v2.html`
2. Commit: `"v2.5: consolidado completo + fotos"`
3. Esperar deploy en Digital Ocean (~2 min)

### Paso 4 — Probar (orden sugerido)

#### Test crítico 1 — Foto en Condición insegura
1. Formulario → Observación → Condición insegura
2. Bajar hasta ver el bloque celeste "📷 Foto (opcional)"
3. Sacar/elegir foto → ver vista previa
4. Llenar también la acción correctiva (responsable, fecha)
5. Enviar → botón dice "Subiendo foto y guardando..."
6. Verificar en Drive: carpeta `EHS_Fotos/2026-05/` con la foto
7. Verificar en el dashboard: el evento muestra 📷, y al abrirlo se ve la foto

#### Test crítico 2 — KPI de operarios correcto
1. Abrir dashboard
2. Mirar "Reportes de operarios" — debe mostrar el % real con detalle "X de Y reportes"
3. Si solo reportaron jefes, debe decir 0% (no 100%)

#### Test crítico 3 — Acción correctiva integrada
1. Cargar Condición insegura con acción correctiva asignada
2. Verificar en hoja Acciones que se creó con prioridad y responsable
3. Verificar que aparece en "Mis Pendientes" del responsable

#### Test 4 — Todo lo demás
- Ruteo en formulario, SafeStart en incidente/accidente, Mis Pendientes, toggle en seguimiento

---

## Validación aplicada antes de entregar

Todos los tests pasaron:
- ✅ Sintaxis JS OK en los 4 archivos (formulario 1186, dashboard 1766, seguimiento 602, Code.gs 794 líneas)
- ✅ Formulario: 6 tipos/subtipos × 5 pasos renderean sin error
- ✅ Foto presente solo en Condición insegura + Ambiente (NO en Acto inseguro)
- ✅ Acción correctiva + tarjeta de aviso presentes en Condición insegura
- ✅ Dashboard: render, Mis Pendientes, Participación, KPIs OK
- ✅ KPI operarios calcula correctamente (no más 100% falso)
- ✅ Backend: uploadFoto + saveAccionInterna + todos los HEADERS coherentes
- ✅ Seguimiento: render OK con toggle
- ✅ Coherencia frontend ↔ backend (61 columnas Eventos, 17 columnas Acciones)

---

## Resumen de la fusión

El problema que resolví: el formulario y el backend estaban **bifurcados** en dos ramas:
- Una rama tenía acción correctiva + tarjeta de aviso (paquete "Acción Integrada")
- Otra rama tenía las fotos (paquete "Fotos")

Nunca habían estado juntas. Esta versión las fusiona, así que ahora tenés UN solo formulario y UN solo backend con TODO.

---

## Pendientes para próximos paquetes

1. **Email al reportador cuando se cierra su acción** (cierre de loop BBS)
2. **KPIs SafeStart en dashboard** (distribución de estados mentales, top errores críticos)
3. **Pantalla pública** modo kiosco
4. **Foto de evidencia al cerrar acción** (antes/después)
5. **Cargar legajos de responsables en Maestros** (recomendado para match más sólido)
6. **Migración de los 105 registros v1** que quedaron pendientes (la migración de eventos falló por mapeo de columna "tipo")
