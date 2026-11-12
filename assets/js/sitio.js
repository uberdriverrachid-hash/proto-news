/* ============================================================
   PROTO NEWS — Motor del sitio
   Lee datos/noticias.json y construye la portada.
   Sin dependencias. Sin frameworks. Carga instantánea.
   ============================================================ */

(function () {
  'use strict';

  var RUTA_DATOS = 'datos/noticias.json';
  var datos = null;

  /* ------------------------------------------------------------
     UTILIDADES
     ------------------------------------------------------------ */

  function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fechaLarga(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) { return ''; }
  }

  function horaCorta(iso) {
    try {
      var d = new Date(iso);
      var ahora = new Date();
      var dif = (ahora - d) / 1000;

      if (dif < 60) return 'ahora mismo';
      if (dif < 3600) return 'hace ' + Math.floor(dif / 60) + ' min';
      if (dif < 86400) return 'hace ' + Math.floor(dif / 3600) + ' h';

      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (e) { return ''; }
  }

  function nombreCategoria(id) {
    if (!datos || !datos.categorias) return id;
    for (var i = 0; i < datos.categorias.length; i++) {
      if (datos.categorias[i].id === id) return datos.categorias[i].nombre;
    }
    return id;
  }

  function ordenarPorFecha(lista) {
    return lista.slice().sort(function (a, b) {
      return new Date(b.fecha) - new Date(a.fecha);
    });
  }

  /* ------------------------------------------------------------
     PLANTILLAS
     ------------------------------------------------------------ */

  function htmlDestacada(n) {
    var credito = n.imagen_credito ? '<p class="destacada-pie">' + escapar(n.imagen_credito) + '</p>' : '';
    return '' +
      '<article class="destacada">' +
        '<span class="destacada-cat">' + escapar(nombreCategoria(n.categoria)) + '</span>' +
        '<h2 class="destacada-titulo"><a href="noticia.html?id=' + encodeURIComponent(n.id) + '">' + escapar(n.titulo) + '</a></h2>' +
        '<p class="destacada-entradilla">' + escapar(n.entradilla || n.resumen) + '</p>' +
        '<a href="noticia.html?id=' + encodeURIComponent(n.id) + '">' +
          '<img class="destacada-imagen" src="' + escapar(n.imagen) + '" alt="' + escapar(n.titulo) + '" loading="eager">' +
        '</a>' +
        credito +
        '<div class="destacada-meta">' +
          '<span class="autor">' + escapar(n.autor || 'Redacción PN') + '</span>' +
          '<span class="sep">|</span>' +
          '<span>' + escapar(horaCorta(n.fecha)) + '</span>' +
        '</div>' +
      '</article>';
  }

  function htmlTarjetaLateral(n) {
    return '' +
      '<a class="tarjeta" href="noticia.html?id=' + encodeURIComponent(n.id) + '">' +
        '<div class="tarjeta-cuerpo">' +
          '<span class="tarjeta-cat">' + escapar(nombreCategoria(n.categoria)) + '</span>' +
          '<h3 class="tarjeta-titulo">' + escapar(n.titulo) + '</h3>' +
          '<span class="tarjeta-meta">' + escapar(horaCorta(n.fecha)) + '</span>' +
        '</div>' +
        '<img class="tarjeta-img" src="' + escapar(n.imagen) + '" alt="' + escapar(n.titulo) + '" loading="eager" decoding="async">' +
      '</a>';
  }

  function htmlNota(n) {
    return '' +
      '<article class="noticia" data-categoria="' + escapar(n.categoria) + '">' +
        '<span class="noticia-cat">' + escapar(nombreCategoria(n.categoria)) + '</span>' +
        '<h3 class="noticia-titulo"><a href="noticia.html?id=' + encodeURIComponent(n.id) + '">' + escapar(n.titulo) + '</a></h3>' +
        '<p class="noticia-resumen">' + escapar(n.resumen) + '</p>' +
        '<a href="noticia.html?id=' + encodeURIComponent(n.id) + '">' +
          '<img class="noticia-img" src="' + escapar(n.imagen) + '" alt="' + escapar(n.titulo) + '" loading="lazy">' +
        '</a>' +
        '<span class="noticia-meta">' + escapar(n.fuente || 'Redacción PN') + ' · ' + escapar(horaCorta(n.fecha)) + '</span>' +
      '</article>';
  }

  /* ------------------------------------------------------------
     CONSTRUCCIÓN DE LA PORTADA
     ------------------------------------------------------------ */

  function construirPortada() {
    var todas = ordenarPorFecha(datos.noticias || []);
    if (!todas.length) return;

    // Destacada: la marcada como destacada más reciente, o la primera
    var destacada = null;
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].destacada) { destacada = todas[i]; break; }
    }
    if (!destacada) destacada = todas[0];

    var resto = todas.filter(function (n) { return n.id !== destacada.id; });

    // Destacada
    var contDestacada = document.getElementById('destacada');
    if (contDestacada) contDestacada.innerHTML = htmlDestacada(destacada);

    // Columna lateral: las 4 siguientes
    var contLateral = document.getElementById('lateral');
    if (contLateral) {
      contLateral.innerHTML = resto.slice(0, 4).map(htmlTarjetaLateral).join('');
    }

    // Rejilla: el resto
    var contRejilla = document.getElementById('rejilla');
    if (contRejilla) {
      contRejilla.innerHTML = resto.slice(4).map(htmlNota).join('');
    }

    // Si no hay suficientes para la rejilla, mostramos todas las que queden
    if (contRejilla && resto.length <= 4) {
      contRejilla.innerHTML = resto.map(htmlNota).join('');
      if (contLateral) contLateral.innerHTML = resto.slice(0, 4).map(htmlTarjetaLateral).join('');
    }

    // Filtros de categoría
    construirFiltros(resto.length > 4 ? resto.slice(4) : resto);
  }

  function construirFiltros(lista) {
    var cont = document.getElementById('filtros');
    if (!cont || !datos.categorias) return;

    var presentes = {};
    lista.forEach(function (n) { presentes[n.categoria] = true; });

    var html = '<button class="filtro activo" data-filtro="todas">Todas</button>';
    datos.categorias.forEach(function (c) {
      if (presentes[c.id]) {
        html += '<button class="filtro" data-filtro="' + escapar(c.id) + '">' + escapar(c.nombre) + '</button>';
      }
    });
    cont.innerHTML = html;

    cont.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.filtro');
      if (!btn) return;

      var filtro = btn.getAttribute('data-filtro');

      // Estado activo
      var todos = cont.querySelectorAll('.filtro');
      for (var i = 0; i < todos.length; i++) todos[i].classList.remove('activo');
      btn.classList.add('activo');

      // Filtrar tarjetas
      var notas = document.querySelectorAll('#rejilla .nota');
      for (var j = 0; j < notas.length; j++) {
        var cat = notas[j].getAttribute('data-categoria');
        notas[j].style.display = (filtro === 'todas' || cat === filtro) ? '' : 'none';
      }
    });
  }

  /* ------------------------------------------------------------
     DATOS DEL SITIO (redes, marca)
     ------------------------------------------------------------ */

  function aplicarDatosSitio() {
    if (!datos) return;

    // Enlaces de redes sociales
    if (datos.redes) {
      var mapa = {
        'enlace-facebook': datos.redes.facebook,
        'enlace-whatsapp': datos.redes.whatsapp,
        'enlace-donar': datos.redes.donaciones,
        'enlace-facebook-flotante': datos.redes.facebook,
        'enlace-whatsapp-flotante': datos.redes.whatsapp,
        'enlace-donar-flotante': datos.redes.donaciones,
        'enlace-donar-pie': datos.redes.donaciones
      };
      Object.keys(mapa).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var url = mapa[id];
        if (url && String(url).trim() !== '') {
          el.setAttribute('href', url);
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });
    }

    // Numero de Zelle para el aviso de donacion
    if (datos.redes && datos.redes.zelle_numero) {
      window.ProtoNewsZelle = datos.redes.zelle_numero;
    }

    // Año del pie
    var anio = document.getElementById('anio');
    if (anio) anio.textContent = new Date().getFullYear();

    // Fecha de actualización
    var act = document.getElementById('actualizado');
    if (act && datos.sitio && datos.sitio.actualizado) {
      act.textContent = fechaLarga(datos.sitio.actualizado);
    }
  }

  /* ------------------------------------------------------------
     ARRANQUE
     ------------------------------------------------------------ */

  function iniciar() {
    fetch(RUTA_DATOS, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar ' + RUTA_DATOS);
        return r.json();
      })
      .then(function (json) {
        datos = json;
        aplicarDatosSitio();
        construirPortada();
        document.body.classList.add('cargado');
      })
      .catch(function (err) {
        console.error('[AE] Error cargando noticias:', err);
        var cont = document.getElementById('destacada');
        if (cont) {
          cont.innerHTML =
            '<div class="placa placa-roja" style="padding:2rem;border-radius:6px">' +
              '<h2 style="font-family:Cinzel,serif;color:#fff;margin-bottom:.8rem">No se pudieron cargar las noticias</h2>' +
              '<p style="color:#9AA2B0;font-size:.9rem">Comprueba que el archivo <code>datos/noticias.json</code> existe y que estás abriendo el sitio desde un servidor (no con doble clic en el archivo).</p>' +
            '</div>';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})();
