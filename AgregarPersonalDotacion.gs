// ============================================================
// AGREGAR PERSONAL NUEVO A MAESTROS
// ============================================================
// Este script agrega las 51 personas del archivo DOTACION_FC
// a la pestaña "Personal" de la hoja "Maestros".
//
// Es SEGURO ejecutarlo varias veces:
// - Si una persona ya existe (por legajo o por nombre), NO la duplica.
// - Reporta cuántas agregó vs cuántas ya existían.
//
// CÓMO USAR:
// 1. Abrí la planilla "Registro SEH Tornquist v2"
// 2. Extensiones → Apps Script
// 3. Archivo nuevo → Script → llamalo "AgregarPersonalDotacion"
// 4. Pegá ESTE contenido
// 5. Guardá
// 6. Seleccioná la función agregarPersonalDotacion en el desplegable
// 7. Click "Ejecutar"
// 8. La primera vez te pedirá permisos — aceptá
// 9. Verás un mensaje con el resultado (agregadas vs duplicadas)
// ============================================================

function agregarPersonalDotacion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Maestros");

  if (!sheet) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Maestros". Verificá que estés en la planilla v2.');
    return;
  }

  // Lista oficial DOTACION_FC — 51 personas
  // Formato: [legajo, "Apellido, Nombre"]
  var personasNuevas = [
    [106278, "Abarzua, Osvaldo Daniel"],
    [106288, "Vallejos, Jose Luis"],
    [106258, "Iriarte, Aldo Jorge"],
    [106260, "Mendez, Marcelo Daniel"],
    [106262, "Wendorff, Pablo Juan"],
    [104166, "Gutierrez, Jorge Alberto"],
    [106310, "Getino, Alejandro Hernan"],
    [106277, "Gonzalez, Hector German"],
    [106285, "Neville, Sergio Jorge Fabian"],
    [106259, "Pieroni, Adrian"],
    [106286, "Garcia, Luis Agustin"],
    [106321, "Labat, Norberto Andres"],
    [106279, "Manfredi, Juan Martin"],
    [106294, "Stoessel, Silvana Karen"],
    [106306, "Hernandez Mascaro, Sergio Javier"],
    [106367, "Panis, Guillermo Adrian"],
    [104265, "Cabrera, Claudio Marcelo"],
    [106271, "Ferrero, Ariel Norman"],
    [106290, "Urriaga, Marcelo Alejandro"],
    [106292, "Goni, Santiago Luis"],
    [106296, "Marconi, Jorge"],
    [106340, "Uribe, Sebastian"],
    [106317, "Iommi, Juan Pablo"],
    [106359, "Montero, Marcelo"],
    [106307, "Echeguia, Martin Alberto"],
    [106323, "Meriggi, Cesar Hugo"],
    [106334, "Lopez, Diego Martin Dario"],
    [106360, "Sanchez, Matias"],
    [106291, "Giampieri, Gonzalo Jose"],
    [106303, "Issaly, Ignacio"],
    [106314, "Rodriguez, Carina Noemi"],
    [106332, "Callava, Sebastian"],
    [104286, "Frias, Ruben Dario"],
    [106365, "Bolletta, Franco"],
    [104321, "Hirsch, Gustavo"],
    [106342, "Gamero, Luciano"],
    [106352, "Heim, Rene"],
    [106318, "Lorenzo, Nelson Guillermo"],
    [106364, "Martinez, Cintia Daniela"],
    [106327, "Colli y Ockier, Maximiliano"],
    [106346, "Urriaga, Martin"],
    [106362, "Bender, Lucas"],
    [104371, "Candal, Nicolas"],
    [104319, "Schwab, Dario Hernan"],
    [106372, "Batstoc, Jonatan Braian"],
    [104337, "Garciarena, Joaquin"],
    [106374, "Meier, Matias"],
    [106355, "Codutti, Cristian"],
    [106358, "Gisler, Guillermo"],
    [106356, "Bilbao, Sofia"],
    [104377, "Zanotto, Agustin"]
  ];

  // Leer el contenido actual de Maestros
  var data = sheet.getDataRange().getValues();
  if (data.length < 1) {
    SpreadsheetApp.getUi().alert('La hoja Maestros está vacía. Verificá el formato.');
    return;
  }

  // Detectar columnas tabla, legajo y nombre
  // Estructura esperada: tabla | clave | valor | clave2 | valor2 ...
  // Personal tiene: tabla="PERSONAL", legajo en col B, nombre en col C
  var headers = data[0];
  var idxTabla = headers.indexOf("tabla");
  var idxLegajo = headers.indexOf("legajo");
  var idxNombre = headers.indexOf("nombre");

  if (idxTabla === -1 || idxLegajo === -1 || idxNombre === -1) {
    SpreadsheetApp.getUi().alert(
      'No encontré las columnas esperadas en Maestros.\n\n' +
      'Headers actuales: ' + headers.join(", ") + '\n\n' +
      'Esperaba: tabla, legajo, nombre'
    );
    return;
  }

  // Construir índice de personas existentes (legajos y nombres normalizados)
  var legajosExistentes = {};
  var nombresExistentes = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[idxTabla]).toUpperCase() === "PERSONAL") {
      var legajoExist = String(row[idxLegajo] || "").trim();
      var nombreExist = String(row[idxNombre] || "").trim().toUpperCase();
      if (legajoExist) legajosExistentes[legajoExist] = true;
      if (nombreExist) nombresExistentes[nombreExist] = true;
    }
  }

  // Procesar cada persona nueva
  var agregadas = [];
  var duplicadasLegajo = [];
  var duplicadasNombre = [];

  personasNuevas.forEach(function(p) {
    var legajo = String(p[0]);
    var nombre = p[1];
    var nombreNorm = nombre.toUpperCase();

    if (legajosExistentes[legajo]) {
      duplicadasLegajo.push(legajo + " - " + nombre);
      return;
    }
    if (nombresExistentes[nombreNorm]) {
      duplicadasNombre.push(legajo + " - " + nombre);
      return;
    }
    agregadas.push([legajo, nombre]);
  });

  // Agregar las que NO son duplicadas
  if (agregadas.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    var rowsToAdd = agregadas.map(function(p) {
      var newRow = new Array(headers.length).fill("");
      newRow[idxTabla] = "PERSONAL";
      newRow[idxLegajo] = p[0];
      newRow[idxNombre] = p[1];
      return newRow;
    });
    sheet.getRange(startRow, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
  }

  // Reporte
  var msg = "RESULTADO:\n\n";
  msg += "✅ Agregadas: " + agregadas.length + " personas\n";
  msg += "⏭ Ya existían (por legajo): " + duplicadasLegajo.length + "\n";
  msg += "⏭ Ya existían (por nombre): " + duplicadasNombre.length + "\n\n";

  if (duplicadasLegajo.length > 0) {
    msg += "DUPLICADAS POR LEGAJO:\n" + duplicadasLegajo.join("\n") + "\n\n";
  }
  if (duplicadasNombre.length > 0) {
    msg += "DUPLICADAS POR NOMBRE:\n" + duplicadasNombre.join("\n") + "\n\n";
  }
  if (agregadas.length > 0) {
    msg += "PRIMERAS 5 AGREGADAS:\n";
    agregadas.slice(0, 5).forEach(function(p) {
      msg += p[0] + " - " + p[1] + "\n";
    });
  }

  SpreadsheetApp.getUi().alert(msg);
  Logger.log(msg);
}

// ============================================================
// VERIFICAR — Lista cuántas personas hay en Maestros sin tocar nada
// ============================================================
function contarPersonalMaestros() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Maestros");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idxTabla = headers.indexOf("tabla");

  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idxTabla]).toUpperCase() === "PERSONAL") count++;
  }

  SpreadsheetApp.getUi().alert("Total personas en Maestros: " + count);
}
