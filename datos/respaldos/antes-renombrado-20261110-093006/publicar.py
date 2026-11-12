#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ACTUALIDAD EXCLUSIVA — Publicador de noticias
=============================================
Herramienta de línea de comandos para publicar noticias en el sitio.

Uso:
    python publicar.py --listar
    python publicar.py --validar
    python publicar.py --borrar ae-2026-11-10-001
    python publicar.py --destacar ae-2026-11-10-003
    python publicar.py --nueva noticia.json

El archivo noticia.json debe tener esta forma:
{
  "titulo": "...",
  "entradilla": "...",
  "resumen": "...",
  "categoria": "cuba",
  "autor": "Rachid García",
  "fuente": "Redacción AE",
  "imagen": "assets/img/foto.jpg",
  "imagen_credito": "Foto: ...",
  "destacada": false,
  "cuerpo": ["Parrafo 1", "## Subtitulo", "Parrafo 2"],
  "etiquetas": ["cuba"]
}
"""

import json
import io
import os
import sys
import argparse
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
RUTA_DATOS = os.path.join(BASE, "datos", "noticias.json")

# Zona horaria de Miami (EST/EDT). Usamos -05:00 como referencia.
TZ_MIAMI = timezone(timedelta(hours=-5))

CAMPOS_OBLIGATORIOS = ["titulo", "resumen", "categoria", "cuerpo"]


def cargar():
    with io.open(RUTA_DATOS, encoding="utf-8") as f:
        return json.load(f)


def guardar(datos):
    # Copia de seguridad antes de escribir
    if os.path.exists(RUTA_DATOS):
        marca = datetime.now().strftime("%Y%m%d-%H%M%S")
        respaldo = os.path.join(BASE, "datos", "respaldos")
        os.makedirs(respaldo, exist_ok=True)
        destino = os.path.join(respaldo, "noticias-%s.json" % marca)
        with io.open(destino, "w", encoding="utf-8") as f:
            json.dump(cargar(), f, ensure_ascii=False, indent=2)

    with io.open(RUTA_DATOS, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)


def generar_id(datos):
    hoy = datetime.now(TZ_MIAMI).strftime("%Y-%m-%d")
    prefijo = "ae-%s-" % hoy
    existentes = [
        n["id"] for n in datos["noticias"]
        if n["id"].startswith(prefijo)
    ]
    numero = 1
    while True:
        candidato = "%s%03d" % (prefijo, numero)
        if candidato not in existentes:
            return candidato
        numero += 1


def validar_noticia(n, categorias):
    errores = []
    for campo in CAMPOS_OBLIGATORIOS:
        if campo not in n or not n[campo]:
            errores.append("falta el campo obligatorio '%s'" % campo)

    if "categoria" in n and n["categoria"] not in categorias:
        errores.append(
            "categoria '%s' no valida. Opciones: %s"
            % (n["categoria"], ", ".join(sorted(categorias)))
        )

    if "cuerpo" in n:
        if not isinstance(n["cuerpo"], list):
            errores.append("'cuerpo' debe ser una lista de parrafos")
        elif len(n["cuerpo"]) == 0:
            errores.append("'cuerpo' esta vacio")

    if "titulo" in n and len(n["titulo"]) > 140:
        errores.append("el titulo es demasiado largo (%d caracteres, max 140)" % len(n["titulo"]))

    if "resumen" in n and len(n["resumen"]) > 300:
        errores.append("el resumen es demasiado largo (%d caracteres, max 300)" % len(n["resumen"]))

    return errores


def cmd_listar(datos):
    print("=" * 78)
    print("NOTICIAS PUBLICADAS — %s" % datos["sitio"]["nombre"])
    print("=" * 78)
    ordenadas = sorted(datos["noticias"], key=lambda x: x["fecha"], reverse=True)
    for n in ordenadas:
        marca = " [DESTACADA]" if n.get("destacada") else ""
        print("\n%s%s" % (n["id"], marca))
        print("  %s" % n["titulo"])
        print("  Categoria: %-12s Fecha: %s" % (n["categoria"], n["fecha"][:16]))
        print("  Fuente: %s" % n.get("fuente", "-"))
    print("\n" + "=" * 78)
    print("Total: %d noticias" % len(datos["noticias"]))
    print("=" * 78)


def cmd_validar(datos):
    categorias = {c["id"] for c in datos["categorias"]}
    errores_totales = []
    ids = set()

    for n in datos["noticias"]:
        errs = validar_noticia(n, categorias)
        for e in errs:
            errores_totales.append("%s: %s" % (n.get("id", "?"), e))
        if n.get("id") in ids:
            errores_totales.append("%s: ID duplicado" % n.get("id"))
        ids.add(n.get("id"))

    destacadas = [n["id"] for n in datos["noticias"] if n.get("destacada")]
    if len(destacadas) > 1:
        errores_totales.append(
            "Hay %d noticias destacadas (debe haber solo 1): %s"
            % (len(destacadas), ", ".join(destacadas))
        )

    print("=" * 78)
    print("VALIDACION DE datos/noticias.json")
    print("=" * 78)
    print("Noticias: %d" % len(datos["noticias"]))
    print("Categorias: %d" % len(datos["categorias"]))
    print("Destacada: %s" % (destacadas[0] if destacadas else "(ninguna, se usara la mas reciente)"))
    print()

    if errores_totales:
        print("PROBLEMAS ENCONTRADOS (%d):" % len(errores_totales))
        for e in errores_totales:
            print("  - %s" % e)
        return 1
    else:
        print("OK — El archivo es valido y el sitio puede leerlo.")
        return 0


def cmd_borrar(datos, id_noticia):
    antes = len(datos["noticias"])
    datos["noticias"] = [n for n in datos["noticias"] if n["id"] != id_noticia]
    despues = len(datos["noticias"])

    if antes == despues:
        print("No se encontro la noticia con ID '%s'" % id_noticia)
        return 1

    guardar(datos)
    print("Noticia '%s' borrada. Quedan %d noticias." % (id_noticia, despues))
    return 0


def cmd_destacar(datos, id_noticia):
    encontrada = False
    for n in datos["noticias"]:
        if n["id"] == id_noticia:
            n["destacada"] = True
            encontrada = True
        else:
            n["destacada"] = False

    if not encontrada:
        print("No se encontro la noticia con ID '%s'" % id_noticia)
        return 1

    guardar(datos)
    print("Noticia '%s' marcada como DESTACADA (portada)." % id_noticia)
    return 0


def cmd_nueva(datos, ruta_json):
    if not os.path.exists(ruta_json):
        print("No existe el archivo: %s" % ruta_json)
        return 1

    with io.open(ruta_json, encoding="utf-8") as f:
        nueva = json.load(f)

    categorias = {c["id"] for c in datos["categorias"]}
    errores = validar_noticia(nueva, categorias)
    if errores:
        print("La noticia tiene errores y NO se publico:")
        for e in errores:
            print("  - %s" % e)
        return 1

    # Completar campos que falten
    nueva.setdefault("id", generar_id(datos))
    nueva.setdefault("autor", "Rachid García")
    nueva.setdefault("fuente", "Redacción AE")
    nueva.setdefault("imagen", "assets/img/placeholder-16x9.svg")
    nueva.setdefault("imagen_credito", "")
    nueva.setdefault("entradilla", nueva["resumen"])
    nueva.setdefault("etiquetas", [])
    nueva.setdefault("destacada", False)

    if "fecha" not in nueva:
        nueva["fecha"] = datetime.now(TZ_MIAMI).isoformat(timespec="seconds")

    # Si se marca como destacada, desmarcar las demas
    if nueva.get("destacada"):
        for n in datos["noticias"]:
            n["destacada"] = False

    datos["noticias"].insert(0, nueva)
    datos["sitio"]["actualizado"] = datetime.now(TZ_MIAMI).isoformat(timespec="seconds")
    guardar(datos)

    print("=" * 78)
    print("NOTICIA PUBLICADA")
    print("=" * 78)
    print("ID:        %s" % nueva["id"])
    print("Titulo:    %s" % nueva["titulo"])
    print("Categoria: %s" % nueva["categoria"])
    print("Fecha:     %s" % nueva["fecha"])
    print("Destacada: %s" % ("SI" if nueva.get("destacada") else "no"))
    print()
    print("URL local: http://127.0.0.1:8080/noticia.html?id=%s" % nueva["id"])
    print("=" * 78)
    return 0


def main():
    p = argparse.ArgumentParser(
        description="Publicador de noticias de Actualidad Exclusiva"
    )
    p.add_argument("--listar", action="store_true", help="Listar todas las noticias")
    p.add_argument("--validar", action="store_true", help="Validar el archivo de datos")
    p.add_argument("--borrar", metavar="ID", help="Borrar una noticia por su ID")
    p.add_argument("--destacar", metavar="ID", help="Marcar una noticia como destacada")
    p.add_argument("--nueva", metavar="ARCHIVO", help="Publicar una noticia desde un JSON")

    args = p.parse_args()

    if not os.path.exists(RUTA_DATOS):
        print("ERROR: no existe %s" % RUTA_DATOS)
        return 1

    datos = cargar()

    if args.listar:
        cmd_listar(datos)
        return 0
    if args.validar:
        return cmd_validar(datos)
    if args.borrar:
        return cmd_borrar(datos, args.borrar)
    if args.destacar:
        return cmd_destacar(datos, args.destacar)
    if args.nueva:
        return cmd_nueva(datos, args.nueva)

    p.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
