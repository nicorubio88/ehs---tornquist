// ============================================================
// EHS TORNQUIST v2 — Backend Apps Script
// Papelera del Sur — Planta Tornquist
// ============================================================

// ============================================================
// CONFIGURACIÓN
// ============================================================
var DESTINATARIOS = [
  "seh-tornquist-notificaciones@googlegroups.com"
];

var NOMBRE_PLANTA = "Planta Tornquist";

// Hojas v2
var SHEET_EVENTOS = "Eventos";
var SHEET_ACCIONES = "Acciones";
var SHEET_MAESTROS = "Maestros";

// Hojas archivo (legacy v1)
var SHEET_REGISTROS_V1 = "Registros_v1_archivo";
var SHEET_DESVIOS_V1 = "Desvios_v1_archivo";

// ============================================================
// HEADERS
// ============================================================
var HEADERS_EVENTOS = [
  "evento_id", "timestamp_carga", "fecha_evento", "hora_evento",
  "tipo", "subtipo", "sector", "turno",
  "reportado_por_legajo", "reportado_por_nombre",
  "descripcion", "prioridad", "foto_url",
  "persona_legajo", "persona_nombre",
  // Observación
  "obs_tipo_acto_condicion", "obs_accion_inmediata",
  // Conversación
  "conv_tema", "conv_compromiso",
  // Incidente
  "inc_equipo_afectado", "inc_dano_estimado_ars", "inc_accion_inmediata",
  "inc_notif_responsable", "inc_notif_a_quien",
  // Accidente
  "acc_parte_cuerpo", "acc_tipo_lesion", "acc_mecanismo",
  "acc_testigo1_legajo", "acc_testigo2_legajo",
  "acc_notif_art", "acc_hora_notif_art", "acc_dias_baja_estimados",
  "acc_accion_inmediata", "acc_notif_responsable", "acc_notif_a_quien",
  // Medio Ambiente
  "amb_sustancia", "amb_cantidad", "amb_unidad",
  "amb_medio_impactado", "amb_contencion_aplicada", "amb_notif_autoridad",
  // Calculadas
  "estado", "cant_acciones", "cant_acciones_cerradas",
  // === NUEVOS CAMPOS PAQUETE D + E (SafeStart + BBS calidad) ===
  // Observación detallada (acto inseguro)
  "obs_hablo_persona", "obs_causa_acto", "obs_estado_observado",
  // Observación detallada (condición insegura)
  "obs_genera_ot", "obs_parada_equipo", "obs_tipo_riesgo",
  // Conversación calidad BBS
  "conv_refuerzo_positivo", "conv_propuesta_propia", "conv_origen",
  // SafeStart en Incidente
  "inc_estado_mental", "inc_error_critico",
  // SafeStart en Accidente
  "acc_estado_mental", "acc_error_critico",
  // Medio Ambiente detallado
  "amb_fuente", "amb_llego_pluvial",
  // Tarjeta de aviso de riesgo (paquete acción integrada)
  "obs_tarjeta_aviso", "obs_nro_tarjeta"
];

var HEADERS_ACCIONES = [
  "accion_id", "evento_id", "nro_accion",
  "descripcion", "responsable_legajo", "responsable_nombre",
  "fecha_creacion", "fecha_vencimiento", "estado",
  "cerrada_por_legajo", "cerrada_por_nombre", "fecha_cierre",
  "foto_evidencia_url", "notas",
  // Columnas nuevas (al final, retro-compatibles)
  "prioridad", "creada_por_legajo", "creada_por_nombre",
  // Área responsable
  "area",
  // Trazabilidad de inicio
  "iniciada_por_legajo", "iniciada_por_nombre", "fecha_inicio",
  // Chat interno (JSON array de {autor, fecha, texto})
  "comentarios"
];

// Áreas válidas para asignación de acciones
var AREAS = ["Mantenimiento", "Producción", "I+D", "Calidad", "EHS", "Recursos Humanos", "Ingeniería"];

// Tipos válidos
var TIPOS = ["OBSERVACION", "CONVERSACION", "INCIDENTE", "ACCIDENTE", "AMBIENTE"];

// Subtipos válidos por tipo (deben coincidir con SUBTIPOS del formulario)
var SUBTIPOS = {
  "OBSERVACION":  ["Acto inseguro", "Condición insegura"],
  "CONVERSACION": ["Refuerzo positivo", "Coaching correctivo", "Charla de seguridad"],
  "INCIDENTE":    ["Casi accidente / cuasi accidente", "Daño material", "Falla equipo con riesgo"],
  "ACCIDENTE":    ["Lesión leve sin baja", "Lesión leve con baja", "Lesión grave", "Fatal"],
  "AMBIENTE":     ["Derrame", "Fuga gas/vapor", "Emisión no controlada", "Residuo mal gestionado", "Ruido fuera de norma"]
};

// ============================================================
// HELPERS
// ============================================================
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#065F46");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateId(prefix) {
  var d = new Date();
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  var hh = String(d.getHours()).padStart(2, "0");
  var mi = String(d.getMinutes()).padStart(2, "0");
  var ss = String(d.getSeconds()).padStart(2, "0");
  return prefix + "-" + yyyy + mm + dd + "-" + hh + mi + ss;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObject(headers, row) {
  var obj = {};
  for (var j = 0; j < headers.length; j++) {
    obj[headers[j]] = row[j];
  }
  return obj;
}

function readSheetAsObjects(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    rows.push(rowToObject(headers, data[i]));
  }
  return rows;
}

// ============================================================
// CALCULADAS: estado del evento se deriva de las acciones
// ============================================================
function calcularEstadoEvento(eventoId, todasLasAcciones) {
  var asociadas = todasLasAcciones.filter(function(a) {
    return String(a.evento_id) === String(eventoId);
  });
  var total = asociadas.length;
  if (total === 0) {
    return { estado: "Sin acciones", cant_acciones: 0, cant_acciones_cerradas: 0 };
  }
  var cerradas = asociadas.filter(function(a) {
    return String(a.estado) === "Cerrada";
  }).length;
  var estado;
  if (cerradas === total) estado = "Cerrado";
  else if (cerradas > 0) estado = "En tratamiento";
  else estado = "Abierto";
  return { estado: estado, cant_acciones: total, cant_acciones_cerradas: cerradas };
}

// ============================================================
// doPost — recibe acciones del frontend
// ============================================================
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var p = e.parameter;
    var action = p.action || "save_evento";

    if (action === "save_evento")        return saveEvento(ss, p);
    if (action === "save_accion")        return saveAccion(ss, p);
    if (action === "upload_foto")        return uploadFoto(p);
    if (action === "actualizar_accion")  return actualizarAccion(ss, p);
    if (action === "agregar_nota")       return agregarNota(ss, p);
    if (action === "reprogramar_accion") return reprogramarAccion(ss, p);
    if (action === "cambiar_responsable")return cambiarResponsable(ss, p);
    if (action === "agregar_comentario") return agregarComentario(ss, p);
    if (action === "cambiar_area")       return cambiarArea(ss, p);

    return jsonResponse({ ok: false, error: "Acción no reconocida: " + action });

  } catch (error) {
    return jsonResponse({ ok: false, error: error.toString() });
  }
}

// ============================================================
// doGet — devuelve datos al frontend
// ============================================================
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tipo = (e && e.parameter && e.parameter.tipo) ? e.parameter.tipo : "all";

    if (tipo === "eventos")  return jsonResponse(readSheetAsObjects(ss.getSheetByName(SHEET_EVENTOS)));
    if (tipo === "acciones") return jsonResponse(readSheetAsObjects(ss.getSheetByName(SHEET_ACCIONES)));
    if (tipo === "maestros") return jsonResponse(readMaestros(ss));

    if (tipo === "all") {
      var eventos = readSheetAsObjects(ss.getSheetByName(SHEET_EVENTOS));
      var acciones = readSheetAsObjects(ss.getSheetByName(SHEET_ACCIONES));
      // Calcular estado dinámico
      eventos.forEach(function(ev) {
        var calc = calcularEstadoEvento(ev.evento_id, acciones);
        ev.estado = calc.estado;
        ev.cant_acciones = calc.cant_acciones;
        ev.cant_acciones_cerradas = calc.cant_acciones_cerradas;
      });
      return jsonResponse({
        eventos: eventos,
        acciones: acciones,
        maestros: readMaestros(ss)
      });
    }

    return jsonResponse({ error: "tipo no reconocido: " + tipo });

  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// ============================================================
// MAESTROS — lee la hoja "Maestros" (varias tablas en una hoja)
// ============================================================
function readMaestros(ss) {
  var sheet = ss.getSheetByName(SHEET_MAESTROS);
  if (!sheet) return { personal: [], sectores: [], responsables: [], sustancias: [], subtipos: SUBTIPOS };
  var data = sheet.getDataRange().getValues();
  var maestros = { personal: [], sectores: [], responsables: [], sustancias: [], subtipos: SUBTIPOS };

  var currentTable = null;
  var currentHeaders = null;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var first = String(row[0] || "").trim().toUpperCase();
    if (!first && (!row[1] || !String(row[1]).trim())) {
      currentTable = null;
      continue;
    }
    if (first === "TABLA") {
      currentTable = String(row[1] || "").trim().toUpperCase();
      currentHeaders = null;
      continue;
    }
    if (currentTable && !currentHeaders) {
      currentHeaders = row.map(function(c) { return String(c || "").trim(); });
      continue;
    }
    if (currentTable && currentHeaders) {
      var obj = {};
      for (var j = 0; j < currentHeaders.length; j++) {
        if (currentHeaders[j]) obj[currentHeaders[j]] = row[j];
      }
      var bucket = ({
        "PERSONAL": "personal",
        "SECTORES": "sectores",
        "RESPONSABLES": "responsables",
        "SUSTANCIAS": "sustancias"
      })[currentTable];
      if (bucket && obj[currentHeaders[0]]) {
        maestros[bucket].push(obj);
      }
    }
  }
  return maestros;
}

// ============================================================
// SAVE EVENTO
// ============================================================
function saveEvento(ss, p) {
  var sheet = getOrCreateSheet(ss, SHEET_EVENTOS, HEADERS_EVENTOS);

  // Validar tipo
  var tipo = String(p.tipo || "").toUpperCase();
  if (TIPOS.indexOf(tipo) === -1) {
    return jsonResponse({ ok: false, error: "Tipo inválido: " + tipo });
  }
  // Validar subtipo
  var subtipo = String(p.subtipo || "");
  if (SUBTIPOS[tipo].indexOf(subtipo) === -1) {
    return jsonResponse({ ok: false, error: "Subtipo inválido para " + tipo + ": " + subtipo });
  }

  var eventoId = p.evento_id || generateId("EVT");

  var row = [
    eventoId,
    new Date().toISOString(),
    p.fecha_evento || "",
    p.hora_evento || "",
    tipo,
    subtipo,
    p.sector || "",
    p.turno || "",
    p.reportado_por_legajo || "",
    p.reportado_por_nombre || "",
    p.descripcion || "",
    p.prioridad || "",
    p.foto_url || "",
    p.persona_legajo || "",
    p.persona_nombre || "",
    // Observación
    p.obs_tipo_acto_condicion || "",
    p.obs_accion_inmediata || "",
    // Conversación
    p.conv_tema || "",
    p.conv_compromiso || "",
    // Incidente
    p.inc_equipo_afectado || "",
    p.inc_dano_estimado_ars || "",
    p.inc_accion_inmediata || "",
    p.inc_notif_responsable || "",
    p.inc_notif_a_quien || "",
    // Accidente
    p.acc_parte_cuerpo || "",
    p.acc_tipo_lesion || "",
    p.acc_mecanismo || "",
    p.acc_testigo1_legajo || "",
    p.acc_testigo2_legajo || "",
    p.acc_notif_art || "",
    p.acc_hora_notif_art || "",
    p.acc_dias_baja_estimados || "",
    p.acc_accion_inmediata || "",
    p.acc_notif_responsable || "",
    p.acc_notif_a_quien || "",
    // Medio Ambiente
    p.amb_sustancia || "",
    p.amb_cantidad || "",
    p.amb_unidad || "",
    p.amb_medio_impactado || "",
    p.amb_contencion_aplicada || "",
    p.amb_notif_autoridad || "",
    // Calculadas iniciales
    "Sin acciones", 0, 0,
    // === NUEVOS CAMPOS PAQUETE D + E ===
    p.obs_hablo_persona || "",
    p.obs_causa_acto || "",
    p.obs_estado_observado || "",
    p.obs_genera_ot || "",
    p.obs_parada_equipo || "",
    p.obs_tipo_riesgo || "",
    p.conv_refuerzo_positivo || "",
    p.conv_propuesta_propia || "",
    p.conv_origen || "",
    p.inc_estado_mental || "",
    p.inc_error_critico || "",
    p.acc_estado_mental || "",
    p.acc_error_critico || "",
    p.amb_fuente || "",
    p.amb_llego_pluvial || "",
    p.obs_tarjeta_aviso || "",
    p.obs_nro_tarjeta || ""
  ];

  sheet.appendRow(row);
  pintarFilaPorPrioridad(sheet, sheet.getLastRow(), p.prioridad);
  enviarNotificacionEvento(p, eventoId);

  // Si el formulario incluyó datos de acción correctiva integrada, crearla
  // Aplica para Condición insegura, Incidente y Ambiente
  var accionCreadaId = null;
  if (p.accion_descripcion && String(p.accion_descripcion).trim() !== "") {
    var accionParams = {
      evento_id: eventoId,
      nro_accion: 1,
      descripcion: p.accion_descripcion,
      responsable_nombre: p.accion_responsable_nombre || "",
      responsable_legajo: p.accion_responsable_legajo || "",
      fecha_vencimiento: p.accion_fecha_cierre || "",
      prioridad: p.accion_prioridad || "",
      estado: "Abierta",
      creada_por_nombre: p.reportado_por_nombre || "",
      creada_por_legajo: p.reportado_por_legajo || ""
    };
    try {
      var resAccion = saveAccionInterna(ss, accionParams);
      accionCreadaId = resAccion.accion_id;
    } catch (e) {
      // Si falla crear la acción, igual el evento se guardó OK
      Logger.log("Error al crear acción integrada: " + e.message);
    }
  }

  return jsonResponse({ ok: true, evento_id: eventoId, accion_id: accionCreadaId });
}

// Función auxiliar interna para crear una acción desde el flujo de evento
function saveAccionInterna(ss, p) {
  var sheet = getOrCreateSheet(ss, SHEET_ACCIONES, HEADERS_ACCIONES);
  var accionId = generateId("ACC");
  var now = new Date();
  var fechaCreacion = Utilities.formatDate(now, "America/Argentina/Buenos_Aires", "yyyy-MM-dd");

  // Respetando el orden de HEADERS_ACCIONES
  var row = [
    accionId,                          // accion_id
    p.evento_id || "",                 // evento_id
    p.nro_accion || 1,                 // nro_accion
    p.descripcion || "",               // descripcion
    p.responsable_legajo || "",        // responsable_legajo
    p.responsable_nombre || "",        // responsable_nombre
    fechaCreacion,                     // fecha_creacion
    p.fecha_vencimiento || "",         // fecha_vencimiento
    p.estado || "Abierta",             // estado
    "",                                // cerrada_por_legajo
    "",                                // cerrada_por_nombre
    "",                                // fecha_cierre
    "",                                // foto_evidencia_url
    "",                                // notas
    p.prioridad || "",                 // prioridad
    p.creada_por_legajo || "",         // creada_por_legajo
    p.creada_por_nombre || "",         // creada_por_nombre
    p.area || "",                      // area (nueva)
    "",                                // iniciada_por_legajo (nueva)
    "",                                // iniciada_por_nombre (nueva)
    "",                                // fecha_inicio (nueva)
    ""                                 // comentarios (nueva)
  ];
  sheet.appendRow(row);

  // Notificar al responsable (placeholder por ahora)
  try {
    enviarNotificacionAccionAsignada(p, accionId);
  } catch (e) {
    Logger.log("Error en notificación de acción: " + e.message);
  }

  return { accion_id: accionId };
}

// Notificación al responsable cuando se le asigna una acción nueva
function enviarNotificacionAccionAsignada(p, accionId) {
  if (!p.responsable_nombre) return;  // sin responsable, no notificar
  var to = "seh-tornquist-notificaciones@googlegroups.com";
  var subject = "Nueva acción correctiva asignada: " + (p.responsable_nombre);
  var body = "Se generó una acción correctiva en el sistema EHS Tornquist:\n\n"
    + "Acción ID: " + accionId + "\n"
    + "Evento origen: " + (p.evento_id || "") + "\n"
    + "Descripción: " + (p.descripcion || "") + "\n"
    + "Responsable: " + (p.responsable_nombre || "") + (p.responsable_legajo ? " (#"+p.responsable_legajo+")" : "") + "\n"
    + "Prioridad: " + (p.prioridad || "—") + "\n"
    + "Fecha de cierre: " + (p.fecha_vencimiento || "—") + "\n"
    + "Creada por: " + (p.creada_por_nombre || "—") + "\n\n"
    + "Esta acción aparece en la sección \"Mis pendientes\" del dashboard del responsable.";
  MailApp.sendEmail(to, subject, body);
}

// ============================================================
// UPLOAD FOTO — recibe base64, guarda en Drive, devuelve URL pública
// ============================================================
function uploadFoto(p) {
  try {
    if (!p.foto_base64) {
      return jsonResponse({ ok: false, error: "No se recibió imagen" });
    }

    // El base64 viene como "data:image/jpeg;base64,XXXX" — separamos el prefijo
    var base64Data = p.foto_base64;
    var contentType = "image/jpeg";
    var comaIdx = base64Data.indexOf(",");
    if (comaIdx !== -1) {
      var prefijo = base64Data.substring(0, comaIdx);
      var match = prefijo.match(/data:([^;]+);/);
      if (match) contentType = match[1];
      base64Data = base64Data.substring(comaIdx + 1);
    }

    // Decodificar
    var bytes = Utilities.base64Decode(base64Data);
    var ahora = new Date();
    var nombreArchivo = "EHS_" + Utilities.formatDate(ahora, "America/Argentina/Buenos_Aires", "yyyyMMdd_HHmmss") + ".jpg";
    var blob = Utilities.newBlob(bytes, contentType, nombreArchivo);

    // Buscar o crear carpeta EHS_Fotos/YYYY-MM
    var carpetaRaiz = obtenerOCrearCarpeta(DriveApp.getRootFolder(), "EHS_Fotos");
    var nombreMes = Utilities.formatDate(ahora, "America/Argentina/Buenos_Aires", "yyyy-MM");
    var carpetaMes = obtenerOCrearCarpeta(carpetaRaiz, nombreMes);

    // Guardar el archivo
    var archivo = carpetaMes.createFile(blob);

    // Permiso público de lectura (cualquiera con el link)
    archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // URL para mostrar la imagen embebida
    var fileId = archivo.getId();
    var urlPublica = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1280";

    return jsonResponse({ ok: true, foto_url: urlPublica, file_id: fileId });

  } catch (error) {
    return jsonResponse({ ok: false, error: "Error al subir foto: " + error.toString() });
  }
}

// Helper: busca una subcarpeta por nombre, la crea si no existe
function obtenerOCrearCarpeta(carpetaPadre, nombre) {
  var existentes = carpetaPadre.getFoldersByName(nombre);
  if (existentes.hasNext()) {
    return existentes.next();
  }
  return carpetaPadre.createFolder(nombre);
}

function pintarFilaPorPrioridad(sheet, row, prioridad) {
  var colors = { "Alta": "#FADBD8", "Media": "#FEF9E7", "Baja": "#D5F5E3" };
  var bg = colors[prioridad] || "#FFFFFF";
  sheet.getRange(row, 1, 1, HEADERS_EVENTOS.length).setBackground(bg);
}

// ============================================================
// SAVE ACCION (acción correctiva)
// ============================================================
function saveAccion(ss, p) {
  var sheet = getOrCreateSheet(ss, SHEET_ACCIONES, HEADERS_ACCIONES);
  var accionId = p.accion_id || generateId("ACC");

  var row = [
    accionId,
    p.evento_id || "",
    p.nro_accion || "",
    p.descripcion || "",
    p.responsable_legajo || "",
    p.responsable_nombre || "",
    new Date().toISOString(),
    p.fecha_vencimiento || "",
    p.estado || "Abierta",
    "", "", "",
    p.foto_evidencia_url || "",
    ""
  ];

  sheet.appendRow(row);
  pintarFilaAccion(sheet, sheet.getLastRow(), p.estado || "Abierta");

  return jsonResponse({ ok: true, accion_id: accionId });
}

function pintarFilaAccion(sheet, row, estado) {
  var colors = { "Abierta": "#FADBD8", "En proceso": "#FDEBD0", "Cerrada": "#D5F5E3", "Cancelada": "#E5E7EB" };
  var bg = colors[estado] || "#FFFFFF";
  sheet.getRange(row, 1, 1, HEADERS_ACCIONES.length).setBackground(bg);
}

// ============================================================
// ACTUALIZAR ACCION (cambio de estado / cierre)
// ============================================================
function actualizarAccion(ss, p) {
  try {
    if (!p.accion_id) {
      return jsonResponse({ ok: false, error: "Falta accion_id en la request" });
    }

    var sheet = getOrCreateSheet(ss, SHEET_ACCIONES, HEADERS_ACCIONES);
    var data = sheet.getDataRange().getValues();
    var idxId = HEADERS_ACCIONES.indexOf("accion_id");
    var idxEstado = HEADERS_ACCIONES.indexOf("estado");
    var idxCerradaPorLegajo = HEADERS_ACCIONES.indexOf("cerrada_por_legajo");
    var idxCerradaPorNombre = HEADERS_ACCIONES.indexOf("cerrada_por_nombre");
    var idxFechaCierre = HEADERS_ACCIONES.indexOf("fecha_cierre");
    var idxFotoEvidencia = HEADERS_ACCIONES.indexOf("foto_evidencia_url");
    var idxIniciadaPorLegajo = HEADERS_ACCIONES.indexOf("iniciada_por_legajo");
    var idxIniciadaPorNombre = HEADERS_ACCIONES.indexOf("iniciada_por_nombre");
    var idxFechaInicio = HEADERS_ACCIONES.indexOf("fecha_inicio");

    // Normalizar el accion_id que viene del cliente (sin espacios, comparación case-insensitive opcional)
    var accionIdBuscado = String(p.accion_id).trim();
    var encontrada = false;
    var filaEncontrada = -1;
    var rowOriginal = null;

    for (var i = 1; i < data.length; i++) {
      var idEnFila = String(data[i][idxId] || "").trim();
      if (idEnFila === accionIdBuscado) {
        encontrada = true;
        filaEncontrada = i;
        rowOriginal = data[i].slice(); // copia
        break;
      }
    }

    if (!encontrada) {
      // Diagnóstico: devolver muestra de IDs disponibles para debug
      var idsDisponibles = [];
      for (var j = 1; j < Math.min(data.length, 6); j++) {
        idsDisponibles.push(String(data[j][idxId] || "").trim());
      }
      return jsonResponse({
        ok: false,
        error: "Acción no encontrada: '" + accionIdBuscado + "'",
        diagnostico: {
          totalFilas: data.length - 1,
          primerosIds: idsDisponibles,
          idBuscado: accionIdBuscado,
          longitudIdBuscado: accionIdBuscado.length
        }
      });
    }

    // Aplicar los setValue
    var nuevoEstado = p.estado || data[filaEncontrada][idxEstado];
    sheet.getRange(filaEncontrada + 1, idxEstado + 1).setValue(nuevoEstado);

    // Trazabilidad de inicio: si pasa a "En proceso" y no tenía fecha de inicio, registrarla
    if (nuevoEstado === "En proceso" && idxFechaInicio >= 0) {
      var fechaInicioActual = data[filaEncontrada][idxFechaInicio];
      if (!fechaInicioActual) {
        if (idxIniciadaPorLegajo >= 0) sheet.getRange(filaEncontrada + 1, idxIniciadaPorLegajo + 1).setValue(p.iniciada_por_legajo || "");
        if (idxIniciadaPorNombre >= 0) sheet.getRange(filaEncontrada + 1, idxIniciadaPorNombre + 1).setValue(p.iniciada_por_nombre || "");
        sheet.getRange(filaEncontrada + 1, idxFechaInicio + 1).setValue(new Date().toISOString());
      }
    }

    if (nuevoEstado === "Cerrada") {
      sheet.getRange(filaEncontrada + 1, idxCerradaPorLegajo + 1).setValue(p.cerrada_por_legajo || "");
      sheet.getRange(filaEncontrada + 1, idxCerradaPorNombre + 1).setValue(p.cerrada_por_nombre || "");
      sheet.getRange(filaEncontrada + 1, idxFechaCierre + 1).setValue(new Date().toISOString());
      if (p.foto_evidencia_url) {
        sheet.getRange(filaEncontrada + 1, idxFotoEvidencia + 1).setValue(p.foto_evidencia_url);
      }
    }

    pintarFilaAccion(sheet, filaEncontrada + 1, nuevoEstado);

    // FLUSH EXPLÍCITO antes de cualquier operación que pueda fallar (como envío de email)
    // Esto garantiza que los setValue se persistan a Sheets antes de seguir.
    SpreadsheetApp.flush();

    // VERIFICAR que se escribió correctamente leyendo de nuevo la celda
    var estadoLeido = sheet.getRange(filaEncontrada + 1, idxEstado + 1).getValue();
    if (String(estadoLeido) !== String(nuevoEstado)) {
      return jsonResponse({
        ok: false,
        error: "La actualización no persistió. Esperado: '" + nuevoEstado + "', leído: '" + estadoLeido + "'"
      });
    }

    // Recién después del flush exitoso enviamos el email (que puede fallar sin afectar la persistencia)
    if (nuevoEstado === "Cerrada") {
      try {
        enviarNotificacionCierreAccion(rowToObject(HEADERS_ACCIONES, rowOriginal), p);
      } catch (mailErr) {
        // El email falló pero la acción se cerró bien. Loggeamos pero devolvemos OK.
        Logger.log("Email de cierre falló pero la acción persistió: " + mailErr.toString());
      }
    }

    return jsonResponse({ ok: true, fila: filaEncontrada + 1, estadoFinal: estadoLeido });

  } catch (err) {
    return jsonResponse({ ok: false, error: "Error en actualizarAccion: " + err.toString() });
  }
}

// ============================================================
// AGREGAR NOTA
// ============================================================
function agregarNota(ss, p) {
  try {
    if (!p.accion_id) return jsonResponse({ ok: false, error: "Falta accion_id" });
    var sheet = ss.getSheetByName(SHEET_ACCIONES);
    if (!sheet) return jsonResponse({ ok: false, error: "Hoja Acciones no existe" });
    var data = sheet.getDataRange().getValues();
    var idxId = HEADERS_ACCIONES.indexOf("accion_id");
    var idxNotas = HEADERS_ACCIONES.indexOf("notas");

    var accionIdBuscado = String(p.accion_id).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idxId] || "").trim() === accionIdBuscado) {
        var notasActuales = data[i][idxNotas] || "";
        var fecha = new Date().toLocaleDateString("es-AR");
        var nuevaNota = fecha + ": " + (p.nota || "");
        var combinadas = notasActuales ? (notasActuales + " | " + nuevaNota) : nuevaNota;
        sheet.getRange(i + 1, idxNotas + 1).setValue(combinadas);
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true, fila: i + 1 });
      }
    }
    return jsonResponse({ ok: false, error: "Acción no encontrada: '" + accionIdBuscado + "'" });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Error en agregarNota: " + err.toString() });
  }
}

// ============================================================
// REPROGRAMAR
// ============================================================
function reprogramarAccion(ss, p) {
  try {
    if (!p.accion_id) return jsonResponse({ ok: false, error: "Falta accion_id" });
    var sheet = ss.getSheetByName(SHEET_ACCIONES);
    if (!sheet) return jsonResponse({ ok: false, error: "Hoja Acciones no existe" });
    var data = sheet.getDataRange().getValues();
    var idxId = HEADERS_ACCIONES.indexOf("accion_id");
    var idxVenc = HEADERS_ACCIONES.indexOf("fecha_vencimiento");
    var idxNotas = HEADERS_ACCIONES.indexOf("notas");

    var accionIdBuscado = String(p.accion_id).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idxId] || "").trim() === accionIdBuscado) {
        var anteriorVenc = data[i][idxVenc];
        sheet.getRange(i + 1, idxVenc + 1).setValue(p.nueva_fecha);
        var notasActuales = data[i][idxNotas] || "";
        var fecha = new Date().toLocaleDateString("es-AR");
        var notaRepr = fecha + ": Reprogramada de " + anteriorVenc + " a " + p.nueva_fecha;
        var combinadas = notasActuales ? (notasActuales + " | " + notaRepr) : notaRepr;
        sheet.getRange(i + 1, idxNotas + 1).setValue(combinadas);
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true, fila: i + 1 });
      }
    }
    return jsonResponse({ ok: false, error: "Acción no encontrada: '" + accionIdBuscado + "'" });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Error en reprogramarAccion: " + err.toString() });
  }
}

// ============================================================
// CAMBIAR RESPONSABLE
// ============================================================
function cambiarResponsable(ss, p) {
  try {
    if (!p.accion_id) return jsonResponse({ ok: false, error: "Falta accion_id" });
    var sheet = ss.getSheetByName(SHEET_ACCIONES);
    if (!sheet) return jsonResponse({ ok: false, error: "Hoja Acciones no existe" });
    var data = sheet.getDataRange().getValues();
    var idxId = HEADERS_ACCIONES.indexOf("accion_id");
    var idxRespLeg = HEADERS_ACCIONES.indexOf("responsable_legajo");
    var idxRespNom = HEADERS_ACCIONES.indexOf("responsable_nombre");
    var idxNotas = HEADERS_ACCIONES.indexOf("notas");
    var idxArea = HEADERS_ACCIONES.indexOf("area");

    var accionIdBuscado = String(p.accion_id).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idxId] || "").trim() === accionIdBuscado) {
        var anterior = data[i][idxRespNom];
        sheet.getRange(i + 1, idxRespLeg + 1).setValue(p.nuevo_legajo || "");
        sheet.getRange(i + 1, idxRespNom + 1).setValue(p.nuevo_nombre || "");
        var notaResp = "";
        // Si viene área, también la actualizamos
        if (p.nueva_area !== undefined && p.nueva_area !== "" && idxArea >= 0) {
          var areaAnterior = data[i][idxArea] || "(sin área)";
          sheet.getRange(i + 1, idxArea + 1).setValue(p.nueva_area);
          notaResp = "Responsable cambiado a " + (p.nuevo_nombre || "") + " (área: " + p.nueva_area + ")";
        } else {
          notaResp = "Responsable cambiado de " + anterior + " a " + (p.nuevo_nombre || "");
        }
        var notasActuales = data[i][idxNotas] || "";
        var fecha = new Date().toLocaleDateString("es-AR");
        var combinadas = notasActuales ? (notasActuales + " | " + fecha + ": " + notaResp) : (fecha + ": " + notaResp);
        sheet.getRange(i + 1, idxNotas + 1).setValue(combinadas);
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true, fila: i + 1 });
      }
    }
    return jsonResponse({ ok: false, error: "Acción no encontrada: '" + accionIdBuscado + "'" });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Error en cambiarResponsable: " + err.toString() });
  }
}

// ============================================================
// CAMBIAR ÁREA (solo el área, sin tocar responsable)
// ============================================================
function cambiarArea(ss, p) {
  try {
    if (!p.accion_id) return jsonResponse({ ok: false, error: "Falta accion_id" });
    var sheet = ss.getSheetByName(SHEET_ACCIONES);
    if (!sheet) return jsonResponse({ ok: false, error: "Hoja Acciones no existe" });
    var data = sheet.getDataRange().getValues();
    var idxId = HEADERS_ACCIONES.indexOf("accion_id");
    var idxArea = HEADERS_ACCIONES.indexOf("area");
    if (idxArea < 0) return jsonResponse({ ok: false, error: "Columna 'area' no existe. Corré migrarColumnasAccion()." });

    var accionIdBuscado = String(p.accion_id).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idxId] || "").trim() === accionIdBuscado) {
        sheet.getRange(i + 1, idxArea + 1).setValue(p.nueva_area || "");
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true, fila: i + 1, area: p.nueva_area });
      }
    }
    return jsonResponse({ ok: false, error: "Acción no encontrada: '" + accionIdBuscado + "'" });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Error en cambiarArea: " + err.toString() });
  }
}

// ============================================================
// AGREGAR COMENTARIO (chat interno por acción)
// Los comentarios se guardan como JSON array de {autor, legajo, fecha, texto}
// ============================================================
function agregarComentario(ss, p) {
  try {
    if (!p.accion_id) return jsonResponse({ ok: false, error: "Falta accion_id" });
    if (!p.texto || !String(p.texto).trim()) return jsonResponse({ ok: false, error: "El comentario está vacío" });

    var sheet = ss.getSheetByName(SHEET_ACCIONES);
    if (!sheet) return jsonResponse({ ok: false, error: "Hoja Acciones no existe" });
    var data = sheet.getDataRange().getValues();
    var idxId = HEADERS_ACCIONES.indexOf("accion_id");
    var idxComentarios = HEADERS_ACCIONES.indexOf("comentarios");
    if (idxComentarios < 0) return jsonResponse({ ok: false, error: "Columna 'comentarios' no existe. Corré migrarColumnasAccion()." });

    var accionIdBuscado = String(p.accion_id).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idxId] || "").trim() === accionIdBuscado) {
        // Parsear comentarios existentes
        var comentariosRaw = data[i][idxComentarios] || "";
        var comentarios = [];
        if (comentariosRaw) {
          try { comentarios = JSON.parse(comentariosRaw); }
          catch (e) { comentarios = []; }
        }
        if (!Array.isArray(comentarios)) comentarios = [];

        // Agregar el nuevo comentario
        comentarios.push({
          autor: String(p.autor_nombre || "Anónimo"),
          legajo: String(p.autor_legajo || ""),
          fecha: new Date().toISOString(),
          texto: String(p.texto).trim()
        });

        sheet.getRange(i + 1, idxComentarios + 1).setValue(JSON.stringify(comentarios));
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true, fila: i + 1, totalComentarios: comentarios.length });
      }
    }
    return jsonResponse({ ok: false, error: "Acción no encontrada: '" + accionIdBuscado + "'" });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Error en agregarComentario: " + err.toString() });
  }
}

// ============================================================
// MIGRACIÓN — agregar columnas nuevas a hoja Acciones existente
// Corré esto UNA VEZ desde el editor de Apps Script si tu hoja
// no tiene las columnas: area, iniciada_por_*, fecha_inicio, comentarios
// ============================================================
function migrarColumnasAccion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ACCIONES);
  if (!sheet) { Logger.log("No existe hoja Acciones"); return; }

  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var faltantes = [];

  HEADERS_ACCIONES.forEach(function(col){
    if (headerRow.indexOf(col) === -1) faltantes.push(col);
  });

  if (faltantes.length === 0) {
    Logger.log("✓ Todas las columnas ya existen. No hay nada que migrar.");
    return;
  }

  Logger.log("Columnas faltantes a agregar: " + faltantes.join(", "));
  var ultimaCol = sheet.getLastColumn();
  faltantes.forEach(function(col, idx){
    sheet.getRange(1, ultimaCol + 1 + idx).setValue(col);
  });
  SpreadsheetApp.flush();
  Logger.log("✓ Migración completa. Se agregaron " + faltantes.length + " columnas.");
}

// ============================================================
// NOTIFICACIONES
// ============================================================
var TIPO_META = {
  "OBSERVACION":  { icono: "👁", label: "Observación",   color: "#185FA5" },
  "CONVERSACION": { icono: "💬", label: "Conversación",  color: "#0F6E56" },
  "INCIDENTE":    { icono: "⚠️", label: "Incidente",     color: "#BA7517" },
  "ACCIDENTE":    { icono: "🔴", label: "Accidente",     color: "#A32D2D" },
  "AMBIENTE":     { icono: "🌿", label: "Medio Ambiente",color: "#3B6D11" }
};

function enviarNotificacionEvento(p, eventoId) {
  try {
    var tipo = String(p.tipo || "").toUpperCase();
    var meta = TIPO_META[tipo] || { icono: "📋", label: tipo, color: "#5F5E5A" };
    var prioridad = p.prioridad || "Media";
    var sector = p.sector || "—";

    var asunto = meta.icono + " [" + prioridad + "] " + meta.label + " " + eventoId + " — " + NOMBRE_PLANTA + " — " + sector;

    var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
      + '<div style="background:' + meta.color + ';color:white;padding:16px 24px;border-radius:8px 8px 0 0;">'
      + '<h2 style="margin:0;font-size:18px;">' + meta.icono + ' Nuevo registro EHS</h2>'
      + '<p style="margin:4px 0 0;font-size:14px;opacity:0.9;">' + meta.label + ' · Prioridad: ' + prioridad + ' · ' + eventoId + '</p>'
      + '</div>'
      + '<div style="border:1px solid #E5E7EB;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
      + fila("Fecha / Hora", (p.fecha_evento || "") + " — " + (p.hora_evento || "") + " hs")
      + fila("Turno", p.turno)
      + fila("Sector", sector)
      + fila("Subtipo", p.subtipo)
      + fila("Reportado por", (p.reportado_por_nombre || "—") + (p.reportado_por_legajo ? " (Leg. " + p.reportado_por_legajo + ")" : ""));

    if (tipo === "ACCIDENTE") {
      html += fila("Persona", (p.persona_nombre || "—") + (p.persona_legajo ? " (Leg. " + p.persona_legajo + ")" : ""))
        + fila("Parte del cuerpo", p.acc_parte_cuerpo)
        + fila("Tipo de lesión", p.acc_tipo_lesion)
        + fila("Mecanismo", p.acc_mecanismo)
        + fila("Notif. ART", p.acc_notif_art);
    } else if (tipo === "INCIDENTE") {
      html += fila("Persona involucrada", p.persona_nombre)
        + fila("Equipo afectado", p.inc_equipo_afectado)
        + fila("Daño estimado", p.inc_dano_estimado_ars ? "$" + p.inc_dano_estimado_ars : "");
    } else if (tipo === "OBSERVACION") {
      html += fila("Persona observada", p.persona_nombre)
        + fila("Tipo", p.obs_tipo_acto_condicion);
    } else if (tipo === "CONVERSACION") {
      html += fila("Persona", p.persona_nombre)
        + fila("Tema", p.conv_tema);
    } else if (tipo === "AMBIENTE") {
      html += fila("Sustancia", p.amb_sustancia)
        + fila("Cantidad", (p.amb_cantidad || "") + " " + (p.amb_unidad || ""))
        + fila("Medio impactado", p.amb_medio_impactado);
    }

    html += '</table>';

    if (p.descripcion) {
      html += '<div style="margin-top:16px;padding:12px 16px;background:#F9FAFB;border-radius:6px;border-left:4px solid ' + meta.color + ';">'
        + '<p style="margin:0 0 4px;font-weight:bold;color:#374151;">Descripción:</p>'
        + '<p style="margin:0;color:#4B5563;">' + p.descripcion + '</p></div>';
    }

    if (p.foto_url) {
      html += '<div style="margin-top:12px;text-align:center;">'
        + '<img src="' + p.foto_url + '" style="max-width:100%;max-height:300px;border-radius:6px;" alt="Foto del evento"/>'
        + '</div>';
    }

    html += '<div style="margin-top:20px;padding:12px;background:#F3F4F6;border-radius:6px;text-align:center;color:#6B7280;font-size:11px;">'
      + NOMBRE_PLANTA + ' · ' + new Date().toLocaleDateString("es-AR")
      + '</div></div></div>';

    MailApp.sendEmail({
      to: DESTINATARIOS.join(","),
      subject: asunto,
      htmlBody: html
    });
  } catch (error) {
    Logger.log("Error enviando notificación: " + error.toString());
  }
}

function enviarNotificacionCierreAccion(accionData, p) {
  try {
    var asunto = "✅ Acción cerrada — " + accionData.accion_id + " — " + NOMBRE_PLANTA;
    var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
      + '<div style="background:#3B6D11;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">'
      + '<h2 style="margin:0;font-size:18px;">✅ Acción cerrada</h2>'
      + '<p style="margin:4px 0 0;font-size:14px;opacity:0.9;">' + accionData.accion_id + ' · Evento: ' + accionData.evento_id + '</p>'
      + '</div>'
      + '<div style="border:1px solid #E5E7EB;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
      + fila("Descripción", accionData.descripcion)
      + fila("Responsable original", accionData.responsable_nombre)
      + fila("Cerrada por", p.cerrada_por_nombre || "—")
      + fila("Fecha de cierre", new Date().toLocaleDateString("es-AR"))
      + '</table>';

    if (p.foto_evidencia_url) {
      html += '<div style="margin-top:12px;text-align:center;">'
        + '<p style="font-weight:bold;color:#374151;margin-bottom:8px;">Evidencia de cierre:</p>'
        + '<img src="' + p.foto_evidencia_url + '" style="max-width:100%;max-height:300px;border-radius:6px;"/>'
        + '</div>';
    }

    html += '</div></div>';
    MailApp.sendEmail({
      to: DESTINATARIOS.join(","),
      subject: asunto,
      htmlBody: html
    });
  } catch (error) {
    Logger.log("Error enviando cierre: " + error.toString());
  }
}

function fila(label, value) {
  if (!value || value === "undefined" || value === "") return "";
  return '<tr>'
    + '<td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-weight:600;color:#374151;width:35%;">' + label + '</td>'
    + '<td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#4B5563;">' + value + '</td>'
    + '</tr>';
}

// ============================================================
// UTILIDADES
// ============================================================
function checkCuota() {
  var restantes = MailApp.getRemainingDailyQuota();
  Logger.log("Emails restantes hoy: " + restantes);
}

function inicializarHojas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, SHEET_EVENTOS, HEADERS_EVENTOS);
  getOrCreateSheet(ss, SHEET_ACCIONES, HEADERS_ACCIONES);
  getOrCreateSheet(ss, SHEET_MAESTROS, []);
  Logger.log("Hojas v2 inicializadas correctamente.");
}
