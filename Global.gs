/**
 * =================================================================
 * ASISTENTE DE ALACENA v3.0 - CONSTANTES GLOBALES (Global.gs)
 * =================================================================
 * @version      3.0.1
 * @lastmodified 2025-08-06 14:00 CST
 * @author       Asistente de Programación (Google)
 *
 * @description  Archivo que centraliza todas las constantes del
 * sistema para facilitar su mantenimiento.
 * =================================================================
 */

// --- Variables Globales de la Hoja de Cálculo ---
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
const CACHE = CacheService.getScriptCache();
const CACHE_EXPIRATION_SECONDS = 300; // 5 minutos

// --- Nombres de las Hojas de Cálculo ---
const SHEETS = {
  DASHBOARD: 'Dashboard',
  INVENTORY: 'Inventario',
  SHOPPING_LIST: 'Lista de Compras',
  MOVEMENTS_LOG: 'Registro de Movimientos',
  STORE_LOCATIONS: 'UbicacionesTiendas',
  CONFIG: '⚙️ Configuración',
  ERROR_LOG: '📜 Log de Errores'
};

// --- Columnas del Inventario (basado en el índice 0) ---
const INVENTORY_COLUMNS = {
  ID: 0,
  PRODUCT_NAME: 1,
  CATEGORY: 2,
  CURRENT_QTY: 3,
  UNIT: 4,
  MIN_STOCK: 5,
  UNIT_COST: 6,
  HOME_LOCATION: 7,
  SUPERMARKET: 8,
  STORE_LOCATION: 9,
  LAST_PURCHASE: 10,
  QR_URL: 11,
  STATUS_ICON: 12,
  TREND: 13
};

// --- Columnas del Registro de Movimientos (basado en el índice 0) ---
const MOVEMENTS_LOG_COLUMNS = {
  TIMESTAMP: 0,
  PRODUCT_ID: 1,
  PRODUCT_NAME: 2,
  QUANTITY: 3,
  MOVEMENT_TYPE: 4,
  MOVEMENT_DETAIL: 5,
  UNIT_COST: 6
};

// --- Colores y Estilos de Formato ---
const COLORS = {
  HEADERS: '#4285f4',      // Azul de Google
  ALERTS: '#fce8e6',       // Rojo pálido para alertas y stock bajo
  AUDIT: '#cfe2f3',        // Azul pálido para la hoja de auditoría
  SUCCESS: '#00875a',      // Verde para mensajes de éxito
  WARNING: '#de350b'       // Rojo para mensajes de advertencia/error
};
