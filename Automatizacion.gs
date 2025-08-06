/**
 * =================================================================
 * ASISTENTE DE ALACENA v3.0 - MÓDULO DE AUTOMATIZACIÓN (Automatizacion.gs)
 * =================================================================
 * @version      3.0.1
 * @lastmodified 2025-08-06 14:00 CST
 * @author       Asistente de Programación (Google)
 *
 * @description  Contiene la lógica que se ejecuta automáticamente
 * en respuesta a eventos, como la edición de celdas.
 * =================================================================
 */

// *****************************************************************
// IMPORTANTE: Asegúrate de tener estas constantes definidas en otro archivo.
// Por ejemplo, en un archivo de constantes llamado "Constantes.gs"
//
// const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
// const SHEETS = {
//   INVENTORY: 'Inventario',
//   MOVEMENTS_LOG: 'Registro de Movimientos'
// };
//
// const INVENTORY_COLUMNS = {
//   ID: 0,
//   PRODUCT_NAME: 1,
//   CURRENT_QTY: 3,
//   MIN_STOCK: 5,
//   UNIT_COST: 7,
//   QR_URL: 11,
//   STATUS_ICON: 12,
//   TREND: 13
// };
//
// const MOVEMENTS_LOG_COLUMNS = {
//   DATE: 0,
//   PRODUCT_ID: 1,
//   PRODUCT_NAME: 2,
//   QUANTITY: 3,
//   TYPE: 4,
//   DETAILS: 5,
//   UNIT_COST: 6
// };
//
// Y una función de log:
// function logError(err, functionName, details) {
//   // Lógica para registrar el error.
// }
// *****************************************************************

/**
 * Maneja el evento de edición en la hoja de cálculo. Es llamado por onEdit en Code.gs.
 * @param {Object} e El objeto de evento de la edición.
 */
function handleSheetEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();
    const row = range.getRow();
    const col = range.getColumn();

    if (sheetName !== SHEETS.INVENTORY || row <= 1) return;

    // Columnas autogeneradas: ID(1), QR(12), Estado(13), Tendencia(14)
    const protectedCols = [
      INVENTORY_COLUMNS.ID + 1, 
      INVENTORY_COLUMNS.QR_URL + 1, 
      INVENTORY_COLUMNS.STATUS_ICON + 1, 
      INVENTORY_COLUMNS.TREND + 1
    ];
    
    if (protectedCols.includes(col)) {
      const oldValue = e.oldValue;
      if (oldValue != null && oldValue !== '') {
        SpreadsheetApp.getUi().alert('Acción no permitida', 'Esta celda es autogenerada y no puede ser editada manualmente. El cambio será revertido.', SpreadsheetApp.getUi().ButtonSet.OK);
        range.setValue(oldValue);
      }
      return;
    }
    
    // Generar ID y QR para productos nuevos
    if (col === INVENTORY_COLUMNS.PRODUCT_NAME + 1 && range.getValue() !== '') {
      procesarNuevoProducto(range);
    }
    
    // Registrar cambios de stock y actualizar visuales
    // Columnas de stock: Cantidad Actual (4) y Stock Mínimo (6)
    if (col === INVENTORY_COLUMNS.CURRENT_QTY + 1 || col === INVENTORY_COLUMNS.MIN_STOCK + 1) {
      registrarCambioDeStock(e);
      actualizarIndicadoresVisuales(row);
    }
  } catch (err) {
    logError(err, 'handleSheetEdit', { range: e.range.getA1Notation(), value: e.value });
  }
}

/**
 * Procesa un nuevo producto, asigna ID y genera QR visible.
 * @param {GoogleAppsScript.Spreadsheet.Range} productCell La celda del producto.
 */
function procesarNuevoProducto(productCell) {
  try {
    const sheet = productCell.getSheet();
    const row = productCell.getRow();
    const idCell = sheet.getRange(row, INVENTORY_COLUMNS.ID + 1);
    const qrCell = sheet.getRange(row, INVENTORY_COLUMNS.QR_URL + 1);
    
    if (productCell.getValue() !== '' && idCell.getValue() === '') {
      const uniqueId = Utilities.getUuid();
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${uniqueId}`;
      
      idCell.setValue(uniqueId);
      qrCell.setFormula(`=IMAGE("${qrUrl}", 4, 120, 120)`);
      sheet.setRowHeight(row, 120);
      actualizarIndicadoresVisuales(row);
    }
  } catch (err) {
    logError(err, 'procesarNuevoProducto', { cell: productCell.getA1Notation() });
  }
}

/**
 * Registra un cambio de stock en la hoja "Registro de Movimientos".
 * @param {Object} e El objeto de evento de la edición.
 * @param {String} tipo El tipo de movimiento (ej. 'Compra', 'Ajuste Auditoría').
 * @param {String} detalle Información adicional sobre el movimiento.
 */
function registrarCambioDeStock(e, tipo = 'Edición Manual', detalle = 'Edición Directa en Hoja') {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    const newValue = Number(e.value) || 0;
    const oldValue = Number(e.oldValue) || 0;

    if (newValue === oldValue) return;

    const idProducto = sheet.getRange(row, INVENTORY_COLUMNS.ID + 1).getValue();
    const nombreProducto = sheet.getRange(row, INVENTORY_COLUMNS.PRODUCT_NAME + 1).getValue();
    const precioUnitario = sheet.getRange(row, INVENTORY_COLUMNS.UNIT_COST + 1).getValue();
    const cambio = newValue - oldValue;

    let tipoMovimiento = tipo;
    if (tipo === 'Edición Manual') {
      if (oldValue === 0 && newValue > 0) {
        tipoMovimiento = 'Ajuste Inicial';
      } else {
        tipoMovimiento = cambio > 0 ? 'Ajuste Manual' : 'Uso en Casa';
      }
    }

    const registroSheet = SPREADSHEET.getSheetByName(SHEETS.MOVEMENTS_LOG);
    if (registroSheet) {
      registroSheet.appendRow([
        new Date(),
        idProducto,
        nombreProducto,
        cambio,
        tipoMovimiento,
        detalle,
        precioUnitario
      ]);
    }
  } catch (err) {
    logError(err, 'registrarCambioDeStock', { range: e.range.getA1Notation(), value: e.value });
  }
}

/**
 * Actualiza los indicadores visuales (Estado y Tendencia) para una fila específica.
 * @param {Number} row El número de la fila a actualizar.
 */
function actualizarIndicadoresVisuales(row) {
  try {
    const inventorySheet = SPREADSHEET.getSheetByName(SHEETS.INVENTORY);
    const movementsSheet = SPREADSHEET.getSheetByName(SHEETS.MOVEMENTS_LOG);

    if (!inventorySheet || !movementsSheet) return;

    const cantidadActual = inventorySheet.getRange(row, INVENTORY_COLUMNS.CURRENT_QTY + 1).getValue();
    const stockMinimo = inventorySheet.getRange(row, INVENTORY_COLUMNS.MIN_STOCK + 1).getValue();

    const estadoCell = inventorySheet.getRange(row, INVENTORY_COLUMNS.STATUS_ICON + 1);
    let estadoIcon = '⚪';
    if (stockMinimo > 0) {
      const percentage = cantidadActual / stockMinimo;
      if (percentage <= 0.25) estadoIcon = '🔴';
      else if (percentage <= 0.5) estadoIcon = '🟡';
      else estadoIcon = '🟢';
    }
    estadoCell.setValue(estadoIcon).setHorizontalAlignment('center');

    const idProducto = inventorySheet.getRange(row, INVENTORY_COLUMNS.ID + 1).getValue();
    
    const movementsData = movementsSheet.getDataRange().getValues();
    const consumptionHistory = movementsData
      .filter(r => r[MOVEMENTS_LOG_COLUMNS.PRODUCT_ID] === idProducto && r[MOVEMENTS_LOG_COLUMNS.QUANTITY] < 0)
      .map(r => Math.abs(r[MOVEMENTS_LOG_COLUMNS.QUANTITY]));
    
    const tendenciaCell = inventorySheet.getRange(row, INVENTORY_COLUMNS.TREND + 1);
    if (consumptionHistory.length > 1) {
      tendenciaCell.setFormula(`=SPARKLINE({${consumptionHistory.join(";")}})`);
    } else {
      tendenciaCell.clearContent();
    }
  } catch (err) {
    logError(err, 'actualizarIndicadoresVisuales', { row: row });
  }
}
