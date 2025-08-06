/**
 * =================================================================
 * ASISTENTE DE ALACENA v3.0 - MÓDULO DE INSTALACIÓN (Setup.gs)
 * =================================================================
 * @version      3.0.2
 * @lastmodified 2025-08-06 14:00 CST
 * @author       Asistente de Programación (Google)
 *
 * @description  Módulo dedicado a la instalación, configuración y
 * reparación del sistema en la hoja de cálculo.
 * =================================================================
 */

/**
 * Configura la hoja de '⚙️ Configuración' con datos por defecto.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet La hoja de configuración.
 */
function setupConfigSheet(sheet) {
  const configValues = [
    ['Email de Notificación', 'tu-email@dominio.com'],
    ['---', '---'],
    ['Categorías Válidas', ''],
    ['', 'Abarrotes'],
    ['', 'Lácteos y Refrigerados'],
    ['', 'Frutas y Verduras'],
    ['', 'Carnes y Pescados'],
    ['', 'Limpieza'],
    ['', 'Cuidado Personal'],
    ['---', '---'],
    ['Unidades de Medida', ''],
    ['', 'pieza'],
    ['', 'litro'],
    ['', 'kg'],
    ['', 'gramo'],
    ['', 'paquete'],
    ['---', '---'],
    ['Ubicaciones en Casa', ''],
    ['', 'Alacena'],
    ['', 'Refrigerador'],
    ['', 'Congelador'],
    ['', 'Baño'],
    ['', 'Cuarto de Limpieza'],
    ['---', '---'],
    ['Supermercados', ''],
    ['', 'Walmart'],
    ['', 'Soriana'],
    ['', 'La Comer'],
    ['---', '---']
  ];
  sheet.getRange(2, 1, configValues.length, 2).setValues(configValues);
  sheet.autoResizeColumns(1, 2);
}

/**
 * Configura la hoja de 'Inventario' con formato y menús desplegables 100% dinámicos.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet La hoja de 'Inventario'.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} configSheet La hoja de '⚙️ Configuración'.
 */
function setupInventorySheet(sheet, configSheet) {
  sheet.setColumnWidth(INVENTORY_COLUMNS.QR_URL + 1, 120);
  sheet.setColumnWidth(INVENTORY_COLUMNS.STATUS_ICON + 1, 60);
  sheet.setColumnWidth(INVENTORY_COLUMNS.TREND + 1, 120);

  const configValues = configSheet.getRange("A:B").getValues();
  const getValidationRange = (header) => {
    const headerRowIndex = configValues.findIndex(row => row[0] === header);
    if (headerRowIndex === -1) return null;
    let startRow = headerRowIndex + 2;
    let endRow = startRow;
    while (endRow < configValues.length && configValues[endRow][0] === '' && configValues[endRow][1] !== '') {
      endRow++;
    }
    // Si la lista tiene elementos, se crea el rango.
    if (endRow > startRow) {
      return configSheet.getRange(startRow, 2, endRow - startRow, 1);
    }
    return null;
  };

  const categoryRange = getValidationRange('Categorías Válidas');
  if (categoryRange) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInRange(categoryRange, true).setAllowInvalid(false).build();
    sheet.getRange(2, INVENTORY_COLUMNS.CATEGORY + 1, sheet.getMaxRows(), 1).setDataValidation(rule);
  }

  const unitRange = getValidationRange('Unidades de Medida');
  if (unitRange) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInRange(unitRange, true).setAllowInvalid(false).build();
    sheet.getRange(2, INVENTORY_COLUMNS.UNIT + 1, sheet.getMaxRows(), 1).setDataValidation(rule);
  }

  const supermarketRange = getValidationRange('Supermercados');
  if (supermarketRange) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInRange(supermarketRange, true).setAllowInvalid(false).build();
    sheet.getRange(2, INVENTORY_COLUMNS.SUPERMARKET + 1, sheet.getMaxRows(), 1).setDataValidation(rule);
  }

  applyConditionalFormatting(sheet);
}

/**
 * Configura el 'Dashboard' con fórmulas en tiempo real y gráficos.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} dashboardSheet La hoja del 'Dashboard'.
 */
function setupDashboardSheet(dashboardSheet) {
  dashboardSheet.clear();
  dashboardSheet.getRange("A1").setValue('Dashboard de Control').setFontSize(18).setFontWeight('bold');

  dashboardSheet.getRange("A3:B4").setBorder(true, true, true, true, true, true);
  dashboardSheet.getRange("A3").setValue('Productos con Stock Bajo').setFontWeight('bold').setVerticalAlignment('middle');
  dashboardSheet.getRange("B3").setFormula(`=IFERROR(COUNTIF(${SHEETS.INVENTORY}!${String.fromCharCode(65 + INVENTORY_COLUMNS.STATUS_ICON)}2:${String.fromCharCode(65 + INVENTORY_COLUMNS.STATUS_ICON)}, "🔴") + COUNTIF(${SHEETS.INVENTORY}!${String.fromCharCode(65 + INVENTORY_COLUMNS.STATUS_ICON)}2:${String.fromCharCode(65 + INVENTORY_COLUMNS.STATUS_ICON)}, "🟡"), 0)`).setFontSize(14).setHorizontalAlignment('center').setVerticalAlignment('middle');
  dashboardSheet.getRange("A4").setValue('Valor Total del Inventario').setFontWeight('bold').setVerticalAlignment('middle');
  dashboardSheet.getRange("B4").setFormula(`=IFERROR(SUMPRODUCT(${SHEETS.INVENTORY}!${String.fromCharCode(65 + INVENTORY_COLUMNS.CURRENT_QTY)}2:${String.fromCharCode(65 + INVENTORY_COLUMNS.CURRENT_QTY)}, ${SHEETS.INVENTORY}!${String.fromCharCode(65 + INVENTORY_COLUMNS.UNIT_COST)}2:${String.fromCharCode(65 + INVENTORY_COLUMNS.UNIT_COST)}), 0)`).setNumberFormat('$#,##0.00').setFontSize(14).setHorizontalAlignment('center').setVerticalAlignment('middle');

  dashboardSheet.getRange("D1").setValue('Resumen para Gráfico').setFontWeight('bold');
  dashboardSheet.getRange("D2").setFormula(`=QUERY(${SHEETS.INVENTORY}!${String.fromCharCode(65 + INVENTORY_COLUMNS.CATEGORY)}2:${String.fromCharCode(65 + INVENTORY_COLUMNS.CATEGORY)}, "SELECT C, COUNT(C) WHERE C IS NOT NULL GROUP BY C LABEL COUNT(C) ''")`);

  SpreadsheetApp.flush();

  const queryResultRange = dashboardSheet.getRange("D2:E" + dashboardSheet.getLastRow());
  const queryResultValues = queryResultRange.getValues();

  if (queryResultValues.length > 1 && queryResultValues[0][0] !== '') {
    const charts = dashboardSheet.getCharts();
    charts.forEach(chart => dashboardSheet.removeChart(chart));

    const chart = dashboardSheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(queryResultRange)
      .setPosition(2, 6, 0, 0)
      .setOption('title', 'Productos por Categoría')
      .build();
    dashboardSheet.insertChart(chart);
  } else {
    dashboardSheet.getRange("D1").clearContent();
    dashboardSheet.getRange("D2").clearContent();
  }

  dashboardSheet.autoResizeColumns(1, 5);
}

/**
 * Aplica el formato condicional que resalta las filas con stock bajo y las filas alternas.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet La hoja a la que se aplicará el formato.
 */
function applyConditionalFormatting(sheet) {
  sheet.clearConditionalFormatRules();
  const range = sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns());

  const lowStockRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND(ISNUMBER($D2), ISNUMBER($F2), $D2<=$F2, $F2<>0)`)
    .setBackground(COLORS.LOW_STOCK)
    .setRanges([range])
    .build();

  const bandedRowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=ISEVEN(ROW())")
    .setBackground('#f8f9fa')
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules([bandedRowRule, lowStockRule]);
}
