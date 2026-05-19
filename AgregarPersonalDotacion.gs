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
[106288, "VALLEJOS, JOSE LUIS"],
[106258, "IRIARTE, ALDO JORGE"],
[106260, "MENDEZ, MARCELO DANIEL"],
[106262, "WENDORFF, PABLO JUAN"],
[104166, "GUTIERREZ, JORGE ALBERTO"],
[106310, "GETINO, ALEJANDRO HERNAN"],
[106277, "GONZALEZ, HECTOR GERMAN"],
[106285, "NEVILLE, SERGIO JORGE FABIAN"],
[106259, "PIERONI, ADRIAN"],
[106286, "GARCIA, LUIS AGUSTIN"],
[106321, "LABAT, NORBERTO ANDRES"],
[106279, "MANFREDI, JUAN MARTIN"],
[106294, "STOESSEL, SILVANA KAREN"],
[106306, "HERNANDEZ MASCARO, SERGIO JAVIER"],
[106367, "PANIS, GUILLERMO ADRIAN"],
[104265, "CABRERA, CLAUDIO MARCELO"],
[106271, "FERRERO, ARIEL NORMAN"],
[106290, "URRIAGA, MARCELO ALEJANDRO"],
[106292, "GONI, SANTIAGO LUIS"],
[106296, "MARCONI, JORGE"],
[106340, "URIBE, SEBASTIAN"],
[106317, "IOMMI, JUAN PABLO"],
[106359, "MONTERO, MARCELO"],
[106307, "ECHEGUIA, MARTIN ALBERTO"],
[106323, "MERIGGI, CESAR HUGO"],
[106334, "LOPEZ, DIEGO MARTIN DARIO"],
[106360, "SANCHEZ, MATIAS"],
[106291, "GIAMPIERI, GONZALO JOSE"],
[106303, "ISSALY, IGNACIO"],
[106314, "RODRIGUEZ, CARINA NOEMI"],
[106332, "CALLAVA, SEBASTIAN"],
[104286, "FRIAS, RUBEN DARIO"],
[106365, "BOLLETTA, FRANCO"],
[104321, "HIRSCH, GUSTAVO"],
[106342, "GAMERO, LUCIANO"],
[106352, "HEIM, RENE"],
[106318, "LORENZO, NELSON GUILLERMO"],
[106364, "MARTINEZ, CINTIA DANIELA"],
[106327, "COLLI Y OCKIER, MAXIMILIANO"],
[106346, "URRIAGA, MARTIN"],
[106362, "BENDER, LUCAS"],
[104371, "CANDAL, NICOLAS"],
[104319, "SCHWAB, DARIO HERNAN"],
[106372, "BATSTOC, JONATAN BRAIAN"],
[104337, "GARCIARENA, JOAQUIN"],
[106374, "MEIER, MATIAS"],
[106355, "CODUTTI, CRISTIAN"],
[106358, "GISLER, GUILLERMO"],
[106356, "BILBAO, SOFIA"],
[104377, "ZANOTTO, AGUSTIN"],
[104111, "BAUER, JUAN HORACIO"],
[104159, "GAMERO, RUBEN LUIS"],
[104171, "GONZALEZ, EDUARDO FABIAN"],
[104173, "PEREZ, MARCELO FABIAN"],
[104175, "VENZI, JORGE ENRIQUE"],
[104180, "FERNANDEZ, ANGEL ALBERTO"],
[104190, "GOMEZ, MARIO HUGO"],
[104193, "QUINTRILEO, JUAN CARLOS"],
[104200, "RAISING, CLAUDIO FABIAN"],
[104210, "RINCON, FABIO MARIA"],
[104220, "FERNANDEZ, ADOLFO ANTONIO"],
[104227, "MARCOLINI, EDGARDO CEFERINO"],
[104230, "RODRIGUEZ, OSVALDO SERGIO"],
[104237, "BARES, GUSTAVO ARIEL"],
[104238, "SCHULZ, FERNANDO ALBERTO"],
[104240, "HEILAND, HUGO OSCAR"],
[104241, "MURILLAS CORNELLI, SERGIO RUBEN"],
[104246, "GONZALEZ, LUIS ALBERTO"],
[104247, "SCHLEGEL, SERGIO DANIEL"],
[104250, "ANTUNEZ, JUAN JOSE"],
[104258, "FERRER, SERGIO RENE"],
[104262, "FLORES, MARTIN ALEJANDRO"],
[104263, "ZARZA, SANDRO ARIEL"],
[104267, "CESONI, OSCAR LUIS"],
[104269, "VALLESE, LUIS MARIA"],
[104275, "RODRIGUEZ, PABLO HERNAN"],
[104277, "BEREZAGA, MAURO JAVIER"],
[104280, "CAMARGO, JUAN CEFERINO"],
[104285, "RIERA, DAMIAN ANGEL"],
[104287, "LANARO, GUSTAVO ALBERTO"],
[104289, "HERRADA, MAURO SEBASTIAN"],
[104292, "GRAFF, EZEQUIEL ADRIAN"],
[104293, "USTUA, JUAN MANUEL"],
[104295, "RAISING, HERNAN MATIAS"],
[104296, "DUPUY, DAVID ANGEL"],
[104297, "SCHWINDT, RICARDO DAVID"],
[104298, "TORSANI, GUSTAVO FABIAN"],
[104300, "BAIER, JUAN CARLOS"],
[104301, "FAHN, JORGE OSCAR BENJAMIN"],
[104303, "TEMPS, BERNARDO OSCAR"],
[104304, "MEDINA, ALEJANDRO DANIEL"],
[104306, "VILA, ALEJANDRO EMILIO"],
[104307, "KRAEMER, SEBASTIAN EDGARDO"],
[104309, "COTTA, SEBASTIAN RAUL"],
[104310, "BERNARDT, LEANDRO MATIAS"],
[104311, "PEREZ, VICTOR FERNANDO"],
[104312, "ALCHAO, JONATAN RODOLFO"],
[104313, "ARATA, ALAN"],
[104315, "SANDOVAL, NICOLAS ROBERTO"],
[104316, "LAMBRECHT, HORACIO JAVIER"],
[104317, "GARRIDO OLIVARES, HERIBERTO"],
[104318, "ESQUIVEL, GABRIEL FERNANDO"],
[104320, "SILVA, DIEGO ARMANDO"],
[104323, "LOPEZ, RODRIGO EZEQUIEL"],
[104324, "IZAGUIRRE, ANDONI"],
[104325, "MOYANO, GUILLERMO JAVIER"],
[104326, "PASTORI, JUAN ALBERTO"],
[104328, "SOUTO, FACUNDO"],
[104329, "SIGISMONDI, CARLOS"],
[104330, "SALAZAR, CRISTIAN"],
[104331, "TRESPALACIOS, LUCIANO"],
[104332, "POLLIO, GASTON"],
[104333, "ARRIETA, CEFERINO JUAN CRUZ"],
[104334, "VILLALBA, KEVIN EMMANUEL"],
[104336, "SEGURA, ANGEL"],
[104338, "GARCIA, GUSTAVO"],
[104339, "LASCALEA, FRANCO"],
[104340, "FUNES, CARLOS"],
[104341, "ECHEGUIA, JUAN"],
[104343, "POLLIO, FEDERICO"],
[104344, "OLMEDO, SEGUNDO"],
[104347, "ZARACHO, ERNESTO"],
[104348, "LARRALDE, MAXIMILIANO"],
[104349, "CATALAN, ALEXIS"],
[104350, "USTUA, JULIAN"],
[104351, "CASSANO, CELESTINO"],
[104352, "FRANCO, GABRIEL"],
[104353, "VILA, GABRIEL"],
[104354, "SANABRIA, EDGAR"],
[104356, "BAUER, INAKI"],
[104357, "QUIROGA, FACUNDO"],
[104358, "SEPULVEDA, LAUTARO"],
[104359, "MARILLAN, BRAIAN"],
[104363, "GIMENEZ, EMILIANO"],
[104364, "BRAUN, MAXIMILIANO"],
[104365, "CIVERCHIA, BRANKO"],
[104366, "LANARO, NATALIO"],
[104367, "EGOBURO, JUAN"],
[104368, "SEPULVEDA, AGUSTIN"],
[104369, "OTEIZA, ADRIAN"],
[104370, "BUCCHI, GERONIMO"],
[104372, "STEFANOF, JUAN"],
[104373, "GODOY, DARIO"],
[104374, "ALVAREZ, BRUNO NICOLAS"],
[104375, "BENZI, LUCAS"],
[104376, "GIMENEZ, LUCAS"],
[104378, "MARTINEZ, SANTIAGO"],
[104379, "SANTANA, ALFREDO EZEQUIEL"],
[104380, "DOSAL, EDUARDO MARTIN"],
[104381, "FERRO, CESAR ALEXIS DAVID"],
[104382, "MORALES, ALEJANDRO DANIEL"],
[104383, "BIOLATO, JUAN MANUEL"],
[104385, "SCHAB, PABLO"],
[104386, "TORRES, NICOLAS"],
[104387, "VENTURA, JOAQUIN"],
[104388, "LANARO, MATIAS"],
[104389, "LLORET, ORLANDO"],
[104391, "MINICH, JULIAN"],
[104392, "LUCENA, THIAGO"],
[104393, "HERRERA, NICOLAS"]
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
