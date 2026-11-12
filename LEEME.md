# Proto News — Sitio web

Sitio de noticias de **Proto News** (actualidadexclusiva.com).
Cobertura de Cuba, Estados Unidos, el mundo y geopolítica para la comunidad
latina y cubanoamericana de Miami.

## Estructura

```
actualidad-exclusiva/
├── index.html              Portada
├── noticia.html            Página de artículo (?id=...)
├── datos/
│   └── noticias.json       ← BASE DE DATOS DE NOTICIAS (aquí se publica)
├── assets/
│   ├── css/
│   │   ├── sistema.css     Sistema de diseño (colores, botones 3D, tipografía)
│   │   ├── interfaz.css    Cabecera, portada, tarjetas, flotantes, pie
│   │   └── articulo.css    Página de artículo
│   ├── js/
│   │   ├── sitio.js        Motor de la portada
│   │   └── articulo.js     Motor de la página de artículo
│   └── img/
│       ├── favicon.svg
│       └── placeholder-16x9.svg
└── LEEME.md                Este archivo
```

## Cómo publicar una noticia

Todo se hace editando **`datos/noticias.json`**. No hay base de datos ni servidor
que mantener: el sitio lee ese archivo y construye la portada al instante.

### Estructura de una noticia

```json
{
  "id": "pn-2026-11-10-007",
  "titulo": "Titular de la noticia",
  "entradilla": "Resumen de dos o tres líneas que aparece bajo el titular.",
  "resumen": "Resumen corto para la tarjeta de la portada.",
  "categoria": "cuba",
  "autor": "Rachid García",
  "fuente": "Redacción PN",
  "fecha": "2026-11-10T08:30:00-05:00",
  "imagen": "assets/img/mi-foto.jpg",
  "imagen_credito": "Foto: Agencia EFE",
  "destacada": false,
  "cuerpo": [
    "Primer párrafo de la noticia.",
    "Segundo párrafo.",
    "## Subtítulo de sección",
    "Párrafo bajo el subtítulo.",
    "> Cita textual destacada."
  ],
  "etiquetas": ["cuba", "migracion"]
}
```

### Reglas del cuerpo

| Prefijo | Resultado |
|---|---|
| (ninguno) | Párrafo normal |
| `## ` | Subtítulo grande (h2) |
| `### ` | Subtítulo pequeño (h3) |
| `> ` | Cita destacada (blockquote) |

### Categorías disponibles

`cuba` · `eeuu` · `mundo` · `geopolitica` · `migracion`

### Marcar la noticia principal

Solo **una** noticia debe tener `"destacada": true`. Es la que ocupa el bloque
grande de la portada. Si no hay ninguna marcada, se usa la más reciente.

## Configuración de redes y donaciones

En la parte superior de `datos/noticias.json`, dentro de `"redes"`:

```json
"redes": {
  "facebook": "https://www.facebook.com/TU_PAGINA",
  "whatsapp": "https://wa.me/1XXXXXXXXXX",
  "telegram": "https://t.me/TU_CANAL",
  "donaciones": "https://ko-fi.com/TU_CUENTA"
}
```

Estos enlaces alimentan automáticamente los botones flotantes y el pie.

## Ver el sitio en local

El sitio necesita un servidor (no funciona con doble clic en el HTML, porque
el navegador bloquea la lectura de `noticias.json` desde `file://`).

```powershell
cd C:\Users\rachi\ProtoAgent\actualidad-exclusiva
python -m http.server 8080
```

Luego abrir: http://127.0.0.1:8080

## Publicar en actualidadexclusiva.com

El dominio está en **Cloudflare**. Opciones, de más simple a más potente:

1. **Cloudflare Pages** (recomendado): subir la carpeta, conectar el dominio.
   Gratis, HTTPS automático, CDN global, despliegue en segundos.
2. **GitHub Pages**: subir a un repositorio y apuntar el CNAME.
3. **Hosting tradicional**: subir por FTP a cualquier hosting.

## Diseño

- **Paleta**: rojo dominante (`#E50914`) + negro profundo + oro (`#C9A961`).
- **Botones 3D**: relieve con luz superior, sombra inferior, borde iluminado,
  elevación y brillo que barre al pasar el ratón.
- **Tipografía**: Cinzel (titulares), Barlow Condensed (interfaz),
  Inter (texto), JetBrains Mono (datos y etiquetas).
- **Sin dependencias**: HTML, CSS y JavaScript puros. Carga instantánea.
