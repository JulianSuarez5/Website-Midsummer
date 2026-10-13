/**
 * Cadenas de texto de la interfaz.
 *
 * Textos que NO son contenido editorial (botones, etiquetas, mensajes de
 * error). El contenido de páginas, proyectos y noticias viene del CMS.
 *
 * Estructura preparada para multiidioma: añadir `en.ts` y un selector de
 * locale es suficiente. No se duplica la aplicación.
 */

export const es = {
  common: {
    skipToContent: 'Saltar al contenido principal',
    menu: 'Menú',
    closeMenu: 'Cerrar menú',
    openMenu: 'Abrir menú',
    mainNavigation: 'Navegación principal',
    footerNavigation: 'Navegación del pie de página',
    breadcrumb: 'Ruta de navegación',
    readMore: 'Leer más',
    loading: 'Cargando…',
    retry: 'Intentar de nuevo',
    close: 'Cerrar',
  },
  actions: {
    contact: 'Contáctanos',
    requestInfo: 'Solicitar información',
    viewAll: 'Ver todo',
    viewDetails: 'Ver detalles',
  },
  states: {
    emptyTitle: 'Todavía no hay información aquí',
    emptyBody:
      'Esta sección se completará cuando Midsummer publique el contenido correspondiente.',
    errorTitle: 'No pudimos cargar esta información',
    errorBody: 'Intenta de nuevo en unos minutos.',
  },
  map: {
    title: 'Proyectos en Colombia',
    loading: 'Cargando el mapa…',
    fallbackTitle: 'Vista de la ubicación de los proyectos',
    noPoints: 'Aún no hay proyectos con ubicación publicada.',
  },
  project: {
    title: 'Proyectos',
    filtersLabel: 'Filtrar proyectos',
    department: 'Departamento',
    installType: 'Tipo de instalación',
    allDepartments: 'Todos los departamentos',
    allTypes: 'Todos los tipos',
    clearFilters: 'Limpiar filtros',
    location: 'Ubicación',
    capacity: 'Potencia',
    year: 'Año',
    status: 'Estado',
    viewProject: 'Ver proyecto',
    mapCardTitle: 'Información del proyecto',
    noCoordinates: 'Ubicación pendiente de publicación por Midsummer',
  },
  contact: {
    title: 'Contacto',
    formTitle: 'Escríbenos',
    name: 'Nombre',
    company: 'Empresa',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    subject: 'Asunto',
    message: 'Mensaje',
    submit: 'Enviar mensaje',
    sending: 'Enviando…',
    required: 'Obligatorio',
    optional: 'Opcional',
    consent:
      'He leído y acepto el aviso de privacidad y el tratamiento de mis datos personales.',
    errors: {
      generic: 'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.',
      requiredName: 'Escribe tu nombre.',
      requiredEmail: 'Escribe tu correo electrónico.',
      invalidEmail: 'El correo electrónico no tiene un formato válido.',
      requiredMessage: 'Escribe tu mensaje.',
      requiredConsent: 'Debes aceptar el aviso de privacidad para continuar.',
    },
    success: 'Gracias. Tu mensaje fue enviado y te responderemos pronto.',
  },
  legal: {
    pendingApproval: 'Contenido pendiente de aprobación',
  },
} as const;

export type Messages = typeof es;
