/**
 * =================================================================
 * ASISTENTE DE ALACENA v3.0 - ORQUESTADOR PRINCIPAL (Code.gs)
 * =================================================================
 * @version      3.0.0
 * @lastmodified 2025-08-06 14:15 CST
 * @author       Asistente de Programación (Google)
 *
 * @description  Archivo principal y punto de entrada del sistema.
 * Contiene los disparadores esenciales y el servidor web,
 * delegando toda la lógica a los módulos especializados.
 *
 * Correcciones y Mejoras Aplicadas en esta Entrega:
 * - Arquitectura Modular: Se ha reducido el tamaño del archivo, moviendo las
 * lógicas de negocio a módulos dedicados. Las funciones onOpen y onEdit
 * ahora solo llaman a las funciones correspondientes en otros archivos.
 * - Servidor Web Optimizado: La función doGet utiliza HtmlService.createTemplateFromFile('WebApp').
 * - Inclusión de Recursos: Se ha añadido la función include() para que la aplicación
 * web pueda cargar otros archivos (como CSS, JS, etc.) si es necesario.
 * =================================================================
 */

// --- Disparadores de la Aplicación ---

/**
 * Se ejecuta cuando un usuario visita la URL de la aplicación web.
 * Sirve el archivo HTML principal.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('WebApp').evaluate()
      .setTitle('Asistente de Alacena v3.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Permite incluir el contenido de otros archivos (CSS, JS) 
 * dentro de nuestro HTML principal.
 * @param {string} filename El nombre del archivo a incluir.
 * @return {string} El contenido del archivo.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Se ejecuta automáticamente cuando se abre la hoja de cálculo.
 * Llama a la función que construye el menú de la aplicación.
 */
function onOpen() {
  createAppMenu();
}

/**
 * Se ejecuta automáticamente cada vez que un usuario edita una celda.
 * Llama a la función que maneja la lógica de las ediciones.
 * @param {Object} e El objeto de evento que contiene información sobre la edición.
 */
function onEdit(e) {
  handleSheetEdit(e);
}
