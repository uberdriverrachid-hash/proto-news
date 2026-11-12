/* ============================================================
   PROTO NEWS — Aviso de donación por Zelle
   Zelle no tiene enlace web, así que mostramos el número
   para que el usuario lo copie y lo pegue en su banco.
   ============================================================ */

(function () {
  'use strict';

  var aviso = null;
  var numeroActual = '';

  function crearAviso() {
    if (document.getElementById('aviso-donar')) return;

    var div = document.createElement('div');
    div.id = 'aviso-donar';
    div.className = 'aviso-fondo';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-labelledby', 'aviso-titulo');

    div.innerHTML =
      '<div class="aviso-caja">' +
        '<button class="aviso-cerrar" aria-label="Cerrar">&times;</button>' +
        '<div class="aviso-icono">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
        '</div>' +
        '<h2 class="aviso-titulo" id="aviso-titulo">Apoya a Proto News</h2>' +
        '<p class="aviso-texto">Tu aporte mantiene la cobertura independiente de Cuba, Estados Unidos y el mundo.</p>' +
        '<div class="aviso-numero-caja">' +
          '<span class="aviso-numero" id="aviso-numero">—</span>' +
          '<button class="aviso-copiar" id="aviso-copiar">Copiar</button>' +
        '</div>' +
        '<a class="aviso-llamar" id="aviso-llamar" href="#">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' +
          'Marcar el número' +
        '</a>' +
        '<ul class="aviso-pasos">' +
          '<li><span>1</span><span>Abre la app de tu banco y busca <strong>Zelle</strong>.</span></li>' +
          '<li><span>2</span><span>Envía el monto al número de arriba.</span></li>' +
          '<li><span>3</span><span>Listo. Gracias por apoyar.</span></li>' +
        '</ul>' +
        '<p class="aviso-nota">Zelle no permite enlaces de pago. Copia el número y pégalo en tu banco.</p>' +
      '</div>';

    document.body.appendChild(div);
    aviso = div;

    // Cerrar
    div.querySelector('.aviso-cerrar').addEventListener('click', cerrar);
    div.addEventListener('click', function (ev) {
      if (ev.target === div) cerrar();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && div.classList.contains('abierto')) cerrar();
    });

    // Copiar
    div.querySelector('#aviso-copiar').addEventListener('click', function () {
      var btn = this;
      var texto = numeroActual;

      function hecho() {
        btn.textContent = '¡Copiado!';
        btn.classList.add('copiado');
        setTimeout(function () {
          btn.textContent = 'Copiar';
          btn.classList.remove('copiado');
        }, 2000);
      }

      // 1) Intentar la API moderna (requiere HTTPS o localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(hecho).catch(function () {
          copiarClasico();
        });
      } else {
        copiarClasico();
      }

      // 2) Metodo clasico: textarea oculto + execCommand
      function copiarClasico() {
        var ok = false;
        try {
          var ta = document.createElement('textarea');
          ta.value = texto;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          ta.setSelectionRange(0, texto.length);
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch (e) {
          ok = false;
        }

        if (ok) {
          hecho();
        } else {
          // 3) Ultimo recurso: dejar el numero seleccionado para Ctrl+C
          seleccionarNumero();
          btn.textContent = 'Ctrl+C';
          setTimeout(function () { btn.textContent = 'Copiar'; }, 2500);
        }
      }

      function seleccionarNumero() {
        var num = document.getElementById('aviso-numero');
        var rango = document.createRange();
        rango.selectNodeContents(num);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rango);
      }
    });
  }

  function abrir(numero) {
    crearAviso();
    numeroActual = numero || '';
    var el = document.getElementById('aviso-numero');
    if (el) el.textContent = numeroActual;

    var tel = document.getElementById('aviso-llamar');
    if (tel && numeroActual) tel.setAttribute('href', 'tel:+' + numeroActual);
    aviso.classList.add('abierto');
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    if (!aviso) return;
    aviso.classList.remove('abierto');
    document.body.style.overflow = '';
  }

  // Exponer para que el motor del sitio lo use
  window.ProtoNewsDonar = {
    abrir: abrir,
    cerrar: cerrar
  };

  // Interceptar clics en los botones de donar
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('#enlace-donar-flotante, #enlace-donar, #enlace-donar-pie');
    if (!el) return;

    var href = el.getAttribute('href') || '';
    // Si es un ancla interna o no hay enlace real, abrimos el aviso
    if (href === '#' || href === '#donar' || href === '') {
      ev.preventDefault();
      var num = (window.ProtoNewsZelle || '');
      abrir(num);
    }
  });

})();
