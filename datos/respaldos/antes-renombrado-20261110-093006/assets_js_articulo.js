/* ============================================================
   ACTUALIDAD EXCLUSIVA — Motor de la página de artículo
   Lee ?id= de la URL y construye la noticia completa.
   ============================================================ */

(function () {
  'use strict';

  var RUTA_DATOS = 'datos/noticias.json';
  var datos = null;

  function escapar(t) {
    if (t === null || t === undefined) return '';
    return String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fechaLarga(iso) {
    try {
      return new Date(iso).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return ''; }
  }

  function nombreCategoria(id) {
    if (!datos || !datos.categorias) return id;
    for (var i = 0; i < datos.categorias.length; i++) {
      if (datos.categorias[i].id === id) return datos.categorias[i].nombre;
    }
    return id;
  }

  function idDeUrl() {
    var p = new URLSearchParams(window.location.search);
    return p.get('id');
  }

  function htmlNotaRelacionada(n) {
    return '' +
      '<a class="nota" href="noticia.html?id=' + encodeURIComponent(n.id) + '">' +
        '<div class="nota-figura">' +
          '<img class="nota-img" src="' + escapar(n.imagen) + '" alt="' + escapar(n.titulo) + '" loading="lazy">' +
          '<span class="nota-cat-flotante">' + escapar(nombreCategoria(n.categoria)) + '</span>' +
        '</div>' +
        '<div class="nota-cuerpo">' +
          '<h3 class="nota-titulo">' + escapar(n.titulo) + '</h3>' +
          '<p class="nota-resumen">' + escapar(n.resumen) + '</p>' +
          '<div class="nota-pie">' +
            '<span class="nota-fuente">' + escapar(n.fuente || 'Redacción AE') + '</span>' +
            '<span>' + escapar(fechaLarga(n.fecha).split(',')[0]) + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function construir(n) {
    // --- Título de la pestaña y metadatos ---
    document.title = n.titulo + ' — Actualidad Exclusiva';

    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', n.resumen || n.entradilla || '');

    var ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute('content', n.titulo);
    var ogD = document.querySelector('meta[property="og:description"]');
    if (ogD) ogD.setAttribute('content', n.resumen || n.entradilla || '');
    var ogI = document.querySelector('meta[property="og:image"]');
    if (ogI) ogI.setAttribute('content', new URL(n.imagen, window.location.href).href);
    var ogU = document.querySelector('meta[property="og:url"]');
    if (ogU) ogU.setAttribute('content', window.location.href);
    var ogTy = document.querySelector('meta[property="og:type"]');
    if (ogTy) ogTy.setAttribute('content', 'article');

    // --- Migas ---
    var migas = document.getElementById('migas');
    if (migas) {
      migas.innerHTML =
        '<a href="index.html">Portada</a><span>›</span>' +
        '<a href="index.html?cat=' + escapar(n.categoria) + '">' + escapar(nombreCategoria(n.categoria)) + '</a>' +
        '<span>›</span><span style="color:#BFC5CF">' + escapar(n.titulo.substring(0, 48)) + (n.titulo.length > 48 ? '…' : '') + '</span>';
    }

    // --- Cabecera ---
    var cab = document.getElementById('articulo-cabecera');
    if (cab) {
      cab.innerHTML =
        '<div class="articulo-meta">' +
          '<span class="etiqueta etiqueta-roja"><span class="punto punto-vivo"></span>' + escapar(nombreCategoria(n.categoria)) + '</span>' +
          '<span class="etiqueta">' + escapar(fechaLarga(n.fecha)) + '</span>' +
        '</div>' +
        '<h1 class="articulo-titulo">' + escapar(n.titulo) + '</h1>' +
        (n.entradilla ? '<p class="articulo-entradilla">' + escapar(n.entradilla) + '</p>' : '') +
        '<div class="articulo-firma">' +
          '<span>Por <strong>' + escapar(n.autor || 'Redacción AE') + '</strong></span>' +
          '<span>·</span>' +
          '<span>Fuente: ' + escapar(n.fuente || 'Redacción AE') + '</span>' +
        '</div>';
    }

    // --- Imagen ---
    var fig = document.getElementById('articulo-figura');
    if (fig) {
      fig.innerHTML =
        '<img src="' + escapar(n.imagen) + '" alt="' + escapar(n.titulo) + '">' +
        (n.imagen_credito ? '<div class="articulo-pie-foto">' + escapar(n.imagen_credito) + '</div>' : '');
    }

    // --- Cuerpo ---
    var cuerpo = document.getElementById('articulo-cuerpo');
    if (cuerpo) {
      var html = '';
      var parrafos = n.cuerpo || [];
      parrafos.forEach(function (p, i) {
        // Si el párrafo empieza por "## " lo tratamos como subtítulo
        if (typeof p === 'string' && p.indexOf('## ') === 0) {
          html += '<h2>' + escapar(p.substring(3)) + '</h2>';
        } else if (typeof p === 'string' && p.indexOf('### ') === 0) {
          html += '<h3>' + escapar(p.substring(4)) + '</h3>';
        } else if (typeof p === 'string' && p.indexOf('> ') === 0) {
          html += '<blockquote>' + escapar(p.substring(2)) + '</blockquote>';
        } else {
          html += '<p>' + escapar(p) + '</p>';
        }
      });
      cuerpo.innerHTML = html;
    }

    // --- Compartir ---
    var url = encodeURIComponent(window.location.href);
    var tit = encodeURIComponent(n.titulo);
    var set = function (id, href) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('href', href);
    };
    set('compartir-facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + url);
    set('compartir-whatsapp', 'https://wa.me/?text=' + tit + '%20' + url);
    set('compartir-telegram', 'https://t.me/share/url?url=' + url + '&text=' + tit);
    set('compartir-x', 'https://twitter.com/intent/tweet?url=' + url + '&text=' + tit);

    var copiar = document.getElementById('compartir-copiar');
    if (copiar) {
      copiar.addEventListener('click', function () {
        var texto = window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(function () {
            copiar.setAttribute('title', '¡Enlace copiado!');
            copiar.style.color = '#25D366';
            setTimeout(function () { copiar.style.color = ''; }, 1800);
          });
        } else {
          window.prompt('Copia el enlace:', texto);
        }
      });
    }

    // --- Relacionadas ---
    var rel = document.getElementById('relacionadas');
    if (rel) {
      var otras = (datos.noticias || [])
        .filter(function (x) { return x.id !== n.id; })
        .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); })
        .slice(0, 3);
      rel.innerHTML = otras.map(htmlNotaRelacionada).join('');
    }
  }

  function error(mensaje) {
    var cab = document.getElementById('articulo-cabecera');
    if (cab) {
      cab.innerHTML =
        '<h1 class="articulo-titulo">Noticia no encontrada</h1>' +
        '<p class="articulo-entradilla">' + escapar(mensaje) + '</p>' +
        '<a class="btn btn-rojo" href="index.html">Volver a la portada</a>';
    }
    var fig = document.getElementById('articulo-figura');
    if (fig) fig.style.display = 'none';
  }

  function iniciar() {
    var id = idDeUrl();
    if (!id) { error('No se indicó qué noticia abrir.'); return; }

    fetch(RUTA_DATOS, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar ' + RUTA_DATOS);
        return r.json();
      })
      .then(function (json) {
        datos = json;
        var n = null;
        for (var i = 0; i < (datos.noticias || []).length; i++) {
          if (datos.noticias[i].id === id) { n = datos.noticias[i]; break; }
        }
        if (!n) { error('La noticia con identificador "' + id + '" no existe o fue retirada.'); return; }
        construir(n);
      })
      .catch(function (err) {
        console.error('[AE] Error:', err);
        error('No se pudieron cargar los datos de la noticia.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})();
