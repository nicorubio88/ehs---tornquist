// ============================================================
// MIGRACIÓN PAQUETE D + E — Agregar columnas SafeStart
// ============================================================
// Este script agrega 14 columnas nuevas al final de la hoja "Eventos"
// sin tocar los datos existentes. Es seguro y reversible.
//
// CÓMO USAR:
// 1. Abrí la planilla "Registro SEH Tornquist v2"
// 2. Extensiones → Apps Script
// 3. Pegá ESTE archivo como un script aparte (Archivo nuevo, llamalo "MigracionSafeStart")
// 4. Asegurate que Code.gs ya tiene el HEADERS_EVENTOS actualizado del Paquete E
// 5. Ejecutá la función agregarColumnasSafeStart()
// 6. Verificá que aparecieron las 14 columnas nuevas al final de la hoja Eventos
// ============================================================

function agregarColumnasSafeStart() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Eventos");

  if (!sheet) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Eventos". Verificá que estés en la planilla v2.');
    return;
  }

  // Las 14 columnas nuevas en orden
  var nuevasColumnas = [
    "obs_hablo_persona",
    "obs_causa_acto",
    "obs_estado_observado",
    "obs_genera_ot",
    "obs_parada_equipo",
    "obs_tipo_riesgo",
    "conv_refuerzo_positivo",
    "conv_propuesta_propia",
    "inc_estado_mental",
    "inc_error_critico",
    "acc_estado_mental",
    "acc_error_critico",
    "amb_fuente",
    "amb_llego_pluvial"
  ];

  // Leer headers actuales
  var lastCol = sheet.getLastColumn();
  var headersActuales = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Verificar cuáles ya existen (para idempotencia)
  var aAgregar = [];
  for (var i = 0; i < nuevasColumnas.length; i++) {
    if (headersActuales.indexOf(nuevasColumnas[i]) === -1) {
      aAgregar.push(nuevasColumnas[i]);
    }
  }

  if (aAgregar.length === 0) {
    SpreadsheetApp.getUi().alert('Las 14 columnas SafeStart ya existen. Nada que hacer.');
    return;
  }

  // Agregar las nuevas columnas al final
  var nuevaPosInicio = lastCol + 1;
  sheet.getRange(1, nuevaPosInicio, 1, aAgregar.length).setValues([aAgregar]);

  // Formato del header (negrita, fondo gris claro como las demás)
  sheet.getRange(1, nuevaPosInicio, 1, aAgregar.length)
    .setFontWeight("bold")
    .setBackground("#F1F5F9")
    .setFontFamily("Inter Tight")
    .setFontSize(10);

  // Auto-ajustar ancho
  sheet.autoResizeColumns(nuevaPosInicio, aAgregar.length);

  SpreadsheetApp.getUi().alert(
    'Migración completada ✓\n\n' +
    'Se agregaron ' + aAgregar.length + ' columnas nuevas al final de la hoja Eventos:\n\n' +
    aAgregar.join('\n') +
    '\n\nLos datos viejos no se tocaron. Las columnas nuevas se llenan a partir de los próximos eventos cargados desde el formulario.'
  );

  Logger.log('Migración Paquete D+E completada. Columnas agregadas: ' + aAgregar.join(', '));
}

// ============================================================
// VERIFICACIÓN — Lista las columnas actuales sin tocar nada
// ============================================================
function verEstructuraEventos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Eventos");

  if (!sheet) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Eventos".');
    return;
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  Logger.log('Total columnas: ' + headers.length);
  Logger.log('Columnas:');
  for (var i = 0; i < headers.length; i++) {
    Logger.log('  ' + (i+1) + '. ' + headers[i]);
  }

  SpreadsheetApp.getUi().alert(
    'Estructura actual de Eventos:\n\n' +
    'Total: ' + headers.length + ' columnas\n\n' +
    'Mirá el Log (Ver → Logs) para ver el listado completo.'
  );
}

// ============================================================
// REVERSIÓN DE PÁNICO — Solo si algo salió mal
// ============================================================
// Esto BORRA las 14 columnas SafeStart del final.
// USAR SOLO si la migración rompió algo.
// ============================================================
function revertirMigracionSafeStart() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert(
    'CONFIRMAR REVERSIÓN',
    '¿Estás seguro? Esto va a BORRAR las 14 columnas SafeStart del final de la hoja Eventos. Los datos en esas columnas se perderán.',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Eventos");
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var columnasASacar = [
    "obs_hablo_persona", "obs_causa_acto", "obs_estado_observado",
    "obs_genera_ot", "obs_parada_equipo", "obs_tipo_riesgo",
    "conv_refuerzo_positivo", "conv_propuesta_propia",
    "inc_estado_mental", "inc_error_critico",
    "acc_estado_mental", "acc_error_critico",
    "amb_fuente", "amb_llego_pluvial"
  ];

  var indicesABorrar = [];
  for (var i = 0; i < columnasASacar.length; i++) {
    var idx = headers.indexOf(columnasASacar[i]);
    if (idx !== -1) indicesABorrar.push(idx + 1); // +1 porque columnas son 1-indexed
  }

  // Borrar de derecha a izquierda para no afectar índices
  indicesABorrar.sort(function(a,b){ return b - a; });
  for (var j = 0; j < indicesABorrar.length; j++) {
    sheet.deleteColumn(indicesABorrar[j]);
  }

  ui.alert('Reversión completada. Se borraron ' + indicesABorrar.length + ' columnas.');
}
