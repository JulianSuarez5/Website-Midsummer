/**
 * Añadir y quitar entradas en los campos repetibles.
 *
 * Se encola solo en las pantallas de edición que tienen campos de Midsummer y
 * es mejora progresiva: el marcado de las entradas ya guardadas lo genera PHP,
 * así que si este archivo no carga se pueden seguir editando.
 *
 * La entrada vacía se clona del `<template>` que imprime PHP, en vez de
 * reconstruirse aquí. El marcado vive en un solo sitio, que es lo que evita que
 * los nombres de los campos se queden sin sustituir.
 */
(function () {
  'use strict';

  var INDEX = '__INDEX__';

  /**
   * Añade una entrada vacía al final del repetible.
   *
   * @param {Element} container Contenedor del repetible.
   * @param {Element} button    Botón que se ha pulsado.
   * @return {Element|null} La fila creada, o null si no se pudo.
   */
  function addRow(container, button) {
    var template = container.querySelector('template[data-midsummer-template]');

    if (!template || !template.content || !template.content.firstElementChild) {
      // Sin soporte de <template> el botón no puede funcionar. Se oculta
      // en lugar de dejar un control que no responde.
      button.parentNode.removeChild(button);

      return null;
    }

    var row = template.content.firstElementChild.cloneNode(true);
    var index = container.querySelectorAll('[data-midsummer-row]').length;
    var fields = row.querySelectorAll('[name]');
    var i;

    // El índice se aplica sobre el HTML porque `name` de un input clonado no
    // se puede cambiar con una propiedad: el atributo es el que se envía.
    for (i = 0; i < fields.length; i++) {
      fields[i].setAttribute(
        'name',
        fields[i].getAttribute('name').split(INDEX).join(String(index)),
      );
    }

    container.insertBefore(row, button.parentNode);

    return row;
  }

  document.addEventListener('click', function (event) {
    var target = event.target;

    if (!target || !target.hasAttribute) {
      return;
    }

    if (target.hasAttribute('data-midsummer-add')) {
      event.preventDefault();

      var container = target.closest('[data-midsummer-repeater]');

      if (!container) {
        return;
      }

      var row = addRow(container, target);

      if (row) {
        // El foco va a la primera casilla: añadir cinco redes seguidas sin
        // poder escribir en ninguna es un rodeo innecesario.
        var first = row.querySelector('input');

        if (first) {
          first.focus();
        }
      }

      return;
    }

    if (target.hasAttribute('data-midsummer-remove')) {
      event.preventDefault();

      var parent = target.closest('[data-midsummer-row]');

      if (parent) {
        parent.remove();
      }
    }
  });
})();
