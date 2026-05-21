// ============================================================
// MIGRACIÓN V1 → V2 — Registro SEH Tornquist
// ============================================================
// Basado en análisis real de la planilla v1:
//
// Categorías en v1:
//   INCIDENTE      (86) → OBSERVACION si subtipo es Cond/Acto insegura
//                       → INCIDENTE si es Cuasi accidente / daño material
//   MEDIO_AMBIENTE (15) → AMBIENTE
//   ACCIDENTE       (5) → ACCIDENTE
//
// CÓMO USAR:
// 1. Asegurate de que la hoja "Registros_v1_archivo" de la planilla v2
//    tenga los datos — pegá el contenido de la hoja "Registros" de v1 ahí
//    (o simplemente renombrá la hoja en la planilla v1)
//    Lo mismo para "Desvios_v1_archivo" ← hoja "Desvios" de v1
//
//    OPCIÓN MÁS SIMPLE: copiá las dos hojas de la planilla v1 a la v2:
//    - En la planilla v1, click derecho en la pestaña "Registros"
//      → "Copiar a" → elegí la planilla v2 → renombrala "Registros_v1_archivo"
//    - Idem con "Desvios" → "Desvios_v1_archivo"
//
// 2. Pegá este script en Apps Script de la planilla v2
// 3. Ejecutá migrarDryRun → ves el resultado sin escribir nada
// 4. Si se ve bien, ejecutá migrarReal
//
// SEGURIDADES:
// - Idempotente: detecta ya migrados por ID, no duplica
// - IDs migrados llevan prefijo "MIG-" para distinguirlos
// - Las hojas v1 NUNCA se modifican
// ============================================================

function migrarDryRun() { ejecutarMigracion(true); }
function migrarReal()   { ejecutarMigracion(false); }

// ── Mapeo de Categoría + Subtipo v1 → Tipo v2 ──────────────
// Lógica real basada en los datos:
// En v1, "INCIDENTE" cubre tanto Observaciones como Incidentes reales.
// La distinción la da el Subtipo:
//   "Condición insegura" / "Acto inseguro" → es una OBSERVACION en v2
//   Cualquier otra cosa (cuasi, daño, etc.)→ es INCIDENTE en v2
function mapearTipoSubtipo(cat, sub) {
  var c = String(cat || "").toUpperCase().trim()
    .replace(/[ÁÀÄÂ]/g,"A").replace(/[ÉÈËÊ]/g,"E")
    .replace(/[ÍÌÏÎ]/g,"I").replace(/[ÓÒÖÔ]/g,"O")
    .replace(/[ÚÙÜÛ]/g,"U").replace(/_/g," ");

  var s = String(sub || "").toLowerCase().trim()
    .replace(/[áàäâ]/g,"a").replace(/[éèëê]/g,"e")
    .replace(/[íìïî]/g,"i").replace(/[óòöô]/g,"o")
    .replace(/[úùüû]/g,"u");

  if (c === "MEDIO AMBIENTE" || c.indexOf("AMBIENTE") !== -1) {
    var subV2 = sub || "Derrame";
    // Mapear subtipos de ambiente
    if (s.indexOf("suelo") !== -1)       subV2 = "Contaminación del suelo";
    if (s.indexOf("atmosf") !== -1)      subV2 = "Emisión atmosférica";
    if (s.indexOf("derrame") !== -1)     subV2 = "Derrame";
    return { tipo: "AMBIENTE", subtipo: subV2 };
  }

  if (c === "ACCIDENTE") {
    var subV2 = "Lesión leve";
    if (s.indexOf("grave") !== -1)                      subV2 = "Lesión grave";
    if (s.indexOf("traslado") !== -1)                   subV2 = "Lesión leve";
    if (s.indexOf("primeros auxilios") !== -1)           subV2 = "Lesión leve";
    return { tipo: "ACCIDENTE", subtipo: subV2 };
  }

  if (c === "INCIDENTE") {
    // Distinguir observación de incidente real por el subtipo
    if (s.indexOf("condic") !== -1 || s.indexOf("acto") !== -1) {
      var subV2 = (s.indexOf("acto") !== -1) ? "Acto inseguro" : "Condición insegura";
      return { tipo: "OBSERVACION", subtipo: subV2 };
    }
    // Si el subtipo es otra cosa o vacío, es incidente real
    var subV2 = "Cuasi accidente";
    if (s.indexOf("da") !== -1 && (s.indexOf("material") !== -1 || s.indexOf("equipo") !== -1))
      subV2 = "Daño material";
    return { tipo: "INCIDENTE", subtipo: subV2 };
  }

  // No reconocido
  return null;
}

// ── Main ────────────────────────────────────────────────────
function ejecutarMigracion(dryRun) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var msg = "MIGRACIÓN V1 → V2 " + (dryRun ? "[DRY RUN — NO ESCRIBE]" : "[MODO REAL]") + "\n\n";

  try {
    var rEv = migrarRegistros(ss, dryRun);
    msg += "EVENTOS (Registros_v1_archivo → Eventos):\n";
    msg += "  Total filas v1: " + rEv.total + "\n";
    msg += "  Vacías: " + rEv.vacias + "\n";
    msg += "  Ya migradas (skip): " + rEv.yaMigradas + "\n";
    msg += "  " + (dryRun ? "A migrar" : "✅ Migradas") + ": " + rEv.migradas + "\n";
    msg += "  Errores: " + rEv.errores.length + "\n";
    if (rEv.errores.length > 0) {
      rEv.errores.slice(0,5).forEach(function(e){ msg += "    - "+e+"\n"; });
    }
    msg += "  Distribución: " + JSON.stringify(rEv.dist) + "\n";
    if (rEv.ejemplo) msg += "  Ej: " + rEv.ejemplo + "\n";
  } catch(e) { msg += "EVENTOS: ERROR — " + e.message + "\n"; }

  msg += "\n";

  try {
    var rAc = migrarDesvios(ss, dryRun);
    msg += "ACCIONES (Desvios_v1_archivo → Acciones):\n";
    msg += "  Total filas v1: " + rAc.total + "\n";
    msg += "  Vacías: " + rAc.vacias + "\n";
    msg += "  Ya migradas (skip): " + rAc.yaMigradas + "\n";
    msg += "  " + (dryRun ? "A migrar" : "✅ Migradas") + ": " + rAc.migradas + "\n";
    if (rAc.ejemplo) msg += "  Ej: " + rAc.ejemplo + "\n";
  } catch(e) { msg += "ACCIONES: ERROR — " + e.message + "\n"; }

  msg += "\n" + (dryRun
    ? "DRY RUN completo. Si se ve bien, ejecutá migrarReal."
    : "MIGRACIÓN COMPLETADA. Recargá el dashboard para ver los datos.");

  SpreadsheetApp.getUi().alert(msg);
  Logger.log(msg);
}

// ── Migrar Registros → Eventos ──────────────────────────────
function migrarRegistros(ss, dryRun) {
  var sV1 = ss.getSheetByName("Registros_v1_archivo");
  var sV2 = ss.getSheetByName("Eventos");
  if (!sV1) throw new Error("No encontré 'Registros_v1_archivo'. Copiá la hoja 'Registros' de la planilla v1 a la v2 y renombrala.");
  if (!sV2) throw new Error("No existe hoja 'Eventos'");
  if (sV1.getLastRow() < 2) return { total:0, vacias:0, yaMigradas:0, migradas:0, errores:[], dist:{}, ejemplo:null };

  var dataV1 = sV1.getDataRange().getValues();
  var headersV2 = sV2.getRange(1, 1, 1, sV2.getLastColumn()).getValues()[0];
  var idxV1 = buildIdx(dataV1[0]);
  var yaMig  = leerMigrados(sV2, "evento_id");

  var vacias=0, yaMigradas=0, migradas=0, errores=[], filas=[], dist={}, ejemplo=null;

  for (var i=1; i<dataV1.length; i++) {
    var row = dataV1[i];
    if (!hayContenido(row)) { vacias++; continue; }

    var idOrig = String(g(row,idxV1,"ID") || i);
    var evId = "MIG-" + idOrig;
    if (yaMig[evId]) { yaMigradas++; continue; }

    try {
      var cat = String(g(row,idxV1,"Categoría") || g(row,idxV1,"Categoria") || "");
      var sub = String(g(row,idxV1,"Subtipo") || "");
      var mapeado = mapearTipoSubtipo(cat, sub);
      if (!mapeado) { errores.push("Fila "+(i+1)+": categoría no reconocida '"+cat+"'"); continue; }

      var tipo    = mapeado.tipo;
      var subtipo = mapeado.subtipo;
      dist[tipo] = (dist[tipo]||0) + 1;

      var fecha = fmtFecha(g(row,idxV1,"Fecha"));
      var hora  = fmtHora(g(row,idxV1,"Hora"));

      // Descripción enriquecida: desc + causa raíz + acciones inmediatas
      var desc     = String(g(row,idxV1,"Descripción") || g(row,idxV1,"Descripcion") || "");
      var causa    = String(g(row,idxV1,"Causa raíz")  || g(row,idxV1,"Causa raiz") || "");
      var acInm    = String(g(row,idxV1,"Acciones inmediatas") || "");
      var acCond   = String(g(row,idxV1,"Acto/Condición seleccionada") || "");
      if (causa) desc += (desc?" | ":"") + "Causa: " + causa;

      // obs_tipo_acto_condicion: solo para OBSERVACION
      var obsAC = "";
      if (tipo === "OBSERVACION") obsAC = subtipo; // "Acto inseguro" o "Condición insegura"

      // Prioridad: v1 usa ALTA/MEDIA/BAJA → v2 usa Alta/Media/Baja
      var prio = String(g(row,idxV1,"Prioridad") || "");
      if (prio) prio = prio.charAt(0).toUpperCase() + prio.slice(1).toLowerCase();

      var data = {
        evento_id:             evId,
        timestamp_carga:       new Date(),
        fecha_evento:          fecha,
        hora_evento:           hora,
        tipo:                  tipo,
        subtipo:               subtipo,
        sector:                String(g(row,idxV1,"Sector")        || ""),
        turno:                 String(g(row,idxV1,"Turno")         || ""),
        reportado_por_nombre:  String(g(row,idxV1,"Reportado por") || ""),
        reportado_por_legajo:  String(g(row,idxV1,"Legajo")        || ""),
        descripcion:           desc,
        prioridad:             prio,
        persona_nombre:        String(g(row,idxV1,"Persona")       || ""),
        // Observación
        obs_tipo_acto_condicion: obsAC,
        obs_accion_inmediata:    acInm,
        obs_estado_observado:    acCond,
        // Accidente
        acc_parte_cuerpo:   String(g(row,idxV1,"Parte del cuerpo") || ""),
        acc_tipo_lesion:    String(g(row,idxV1,"Tipo accidente")    || ""),
        acc_notif_art:      String(g(row,idxV1,"Notif. ART")        || ""),
        // Incidente/Accidente: notificaciones
        inc_notif_responsable: String(g(row,idxV1,"Notif. responsable área") || ""),
        inc_notif_a_quien:     String(g(row,idxV1,"Responsable notificado")  || ""),
        // Ambiente
        amb_sustancia:          String(g(row,idxV1,"Sustancia")        || ""),
        amb_cantidad:           String(g(row,idxV1,"Volumen estimado") || ""),
        amb_notif_autoridad:    String(g(row,idxV1,"Notif. autoridad") || ""),
        amb_contencion_aplicada:String(g(row,idxV1,"Contención") || g(row,idxV1,"Contencion") || ""),
        // Estado inicial
        estado:                "Sin acciones",
        cant_acciones:         0,
        cant_acciones_cerradas:0
      };

      filas.push(buildRow(headersV2, data));
      migradas++;
      if (!ejemplo) ejemplo = evId + " → " + tipo + "/" + subtipo + " [" + fecha + "] rep:" + data.reportado_por_nombre;

    } catch(e) { errores.push("Fila "+(i+1)+": "+e.message); }
  }

  if (!dryRun && filas.length > 0) {
    sV2.getRange(sV2.getLastRow()+1, 1, filas.length, headersV2.length).setValues(filas);
  }
  return { total:dataV1.length-1, vacias:vacias, yaMigradas:yaMigradas, migradas:migradas, errores:errores, dist:dist, ejemplo:ejemplo };
}

// ── Migrar Desvios → Acciones ────────────────────────────────
function migrarDesvios(ss, dryRun) {
  var sV1 = ss.getSheetByName("Desvios_v1_archivo");
  var sV2 = ss.getSheetByName("Acciones");
  if (!sV1) throw new Error("No encontré 'Desvios_v1_archivo'. Copiá la hoja 'Desvios' de la planilla v1 a la v2 y renombrala.");
  if (!sV2) throw new Error("No existe hoja 'Acciones'");
  if (sV1.getLastRow() < 2) return { total:0, vacias:0, yaMigradas:0, migradas:0, ejemplo:null };

  var dataV1 = sV1.getDataRange().getValues();
  var headersV2 = sV2.getRange(1, 1, 1, sV2.getLastColumn()).getValues()[0];
  var idxV1 = buildIdx(dataV1[0]);
  var yaMig  = leerMigrados(sV2, "accion_id");

  var vacias=0, yaMigradas=0, migradas=0, filas=[], ejemplo=null;

  for (var i=1; i<dataV1.length; i++) {
    var row = dataV1[i];
    if (!hayContenido(row)) { vacias++; continue; }

    var idOrig   = String(g(row,idxV1,"Desvio_ID") || i);
    var accionId = "MIG-" + idOrig;
    if (yaMig[accionId]) { yaMigradas++; continue; }

    // El Evento_ID en desvíos es el ID original (ej "INC-001")
    // En v2 ese evento quedó como "MIG-INC-001"
    var evIdV1 = String(g(row,idxV1,"Evento_ID") || "");
    var evIdV2 = evIdV1 ? "MIG-" + evIdV1 : "";

    var nroRaw = g(row,idxV1,"Nro_Accion");
    var nro    = nroRaw ? parseInt(String(nroRaw)) || 1 : 1;

    var data = {
      accion_id:          accionId,
      evento_id:          evIdV2,
      nro_accion:         nro,
      descripcion:        String(g(row,idxV1,"Descripcion")     || ""),
      responsable_nombre: String(g(row,idxV1,"Responsable")     || ""),
      responsable_legajo: "",
      fecha_creacion:     fmtFecha(g(row,idxV1,"Fecha_Creacion")),
      fecha_vencimiento:  fmtFecha(g(row,idxV1,"Fecha_Vencimiento")),
      estado:             String(g(row,idxV1,"Estado") || "Abierta"),
      cerrada_por_nombre: String(g(row,idxV1,"Cerrado_Por")     || ""),
      fecha_cierre:       fmtFecha(g(row,idxV1,"Fecha_Cierre")),
    };

    filas.push(buildRow(headersV2, data));
    migradas++;
    if (!ejemplo) ejemplo = accionId + " → evento:" + evIdV2 + " resp:" + data.responsable_nombre + " estado:" + data.estado;
  }

  if (!dryRun && filas.length > 0) {
    sV2.getRange(sV2.getLastRow()+1, 1, filas.length, headersV2.length).setValues(filas);
  }
  return { total:dataV1.length-1, vacias:vacias, yaMigradas:yaMigradas, migradas:migradas, ejemplo:ejemplo };
}

// ── Helpers ──────────────────────────────────────────────────
function buildIdx(headerRow) {
  var m = {};
  for (var i=0; i<headerRow.length; i++) {
    var h = String(headerRow[i]||"").trim();
    if (h) m[h] = i;
  }
  return m;
}

function g(row, idx, nombre) {
  if (idx[nombre] !== undefined) {
    var v = row[idx[nombre]];
    return (v === null || v === undefined) ? "" : v;
  }
  return "";
}

function fmtFecha(val) {
  if (!val || val === "") return "";
  if (val instanceof Date) return Utilities.formatDate(val, "America/Argentina/Buenos_Aires", "yyyy-MM-dd");
  var s = String(val).replace("T"," ").substring(0,10);
  return s;
}

function fmtHora(val) {
  if (!val || val === "") return "";
  if (val instanceof Date) return Utilities.formatDate(val, "UTC", "HH:mm");
  return String(val).substring(0,5);
}

function hayContenido(row) {
  return row.some(function(v){ return v !== null && v !== undefined && String(v).trim() !== ""; });
}

function leerMigrados(sheet, colName) {
  var mapa = {};
  if (sheet.getLastRow() < 2) return mapa;
  var hdrs = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  var col  = hdrs.indexOf(colName);
  if (col === -1) return mapa;
  var ids = sheet.getRange(2, col+1, sheet.getLastRow()-1, 1).getValues();
  ids.forEach(function(r){
    var id = String(r[0]||"");
    if (id.indexOf("MIG-") === 0) mapa[id] = true;
  });
  return mapa;
}

function buildRow(headers, data) {
  var row = new Array(headers.length).fill("");
  Object.keys(data).forEach(function(k){
    var i = headers.indexOf(k);
    if (i !== -1) row[i] = (data[k] === undefined) ? "" : data[k];
  });
  return row;
}
