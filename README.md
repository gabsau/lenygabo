# Guía de viajes de Leny & Gabo

Sitio estático (HTML, CSS y JavaScript sin dependencias) con nuestras guías de viaje.
Se publica en GitHub Pages y también se puede abrir en local haciendo doble clic en `index.html`.

## Estructura

```
index.html                 página única con portada y vistas de viaje (rutas por #hash)
estilos.css                estilos
app.js                     router, render, mosaicos de fotos y visor
datos.js                   CONTENIDO: viajes, lugares, platos, bebidas (se edita a mano)
fotos.js                   GENERADO: lista de fotos por lugar (se regenera con el script)
fuentes/                   tipografía Young Serif (titulares)
IMAGENES/<VIAJE>/<LUGAR>/  fotos de cada lugar o bebida
IMAGENES/<VIAJE>/PORTADA.jpg      foto (o .svg) de portada del viaje
IMAGENES/<VIAJE>/PORTADA-og.jpg   imagen 1200×630 para la vista previa al compartir
viajes/<id>.cifrado.js     GENERADO: contenido cifrado de un viaje privado
herramientas/actualizar-fotos.mjs
herramientas/cifrar-viaje.mjs
respaldo/                  originales, contraseñas y versiones anteriores (no se publica)
```

## Añadir fotos

1. Copia las fotos a `IMAGENES/<VIAJE>/<NOMBRE DEL LUGAR>/`. El nombre de la carpeta se compara
   con `nombre` y `alias` del lugar (o de la bebida) en `datos.js` sin importar mayúsculas, acentos
   ni signos (por ejemplo `BORDA BERI` casa con `Borda Berri` gracias a su alias, y `cana` con `Caña`).
   Las bebidas necesitan un `id` en `datos.js` para poder llevar fotos.
2. Ejecuta:

   ```bash
   node herramientas/actualizar-fotos.mjs
   ```

   El script reescribe `fotos.js`, avisa de carpetas que no coinciden con ningún lugar y reduce
   las fotos pesadas (más de 600 KB o 1600 px) guardando el original en `respaldo/originales/`.
   Usa `--sin-optimizar` para no tocar las imágenes.
3. Opcional: escribe los pies de foto en el campo `"pie"` de `fotos.js` y reordena las fotos
   (la primera es la grande del mosaico). El script conserva ambas cosas en siguientes ejecuciones.
4. Fotos en HEIC no se ven en el navegador: conviértelas a JPG antes.

## Añadir un viaje

1. En `datos.js`, copia el bloque de un viaje dentro de `viajes: [...]` y cambia `id`, `titulo`,
   `subtitulo`, `fecha`, `intro`, `portada`, `carpetaFotos` y las secciones.
   Cada sección tiene `lugares` (con `nombre`, `tipo`, `zona`, `platos`, `direccion`, `cp`, `maps`)
   o `bebidas` (con `nombre` y `texto`). `corto` es el texto de la pestaña.
2. Crea `IMAGENES/<VIAJE>/` con una carpeta por lugar y una `PORTADA.jpg`.
3. Ejecuta `node herramientas/actualizar-fotos.mjs`.
4. Enlace directo al viaje: `…/#/<id-del-viaje>`; a una sección: `…/#/<id-del-viaje>/<id-seccion>`.

Los enlaces de Google Maps usan el formato
`https://www.google.com/maps/search/?api=1&query=<Nombre+Direccion+Ciudad>`, que abre la app en el móvil.

## Viaje privado (con contraseña)

Un viaje puede ser un HTML completo hecho aparte (por ejemplo el planificador de Orlando 2026, que
se arma con su propio `build.py` en `~/Downloads/orlando2026/`). Como lleva reservas y datos de la
familia, no se publica en claro: se cifra y solo se abre con contraseña.

1. En `datos.js` el viaje no lleva `secciones`, sino `privado: { archivo: 'viajes/<id>.cifrado.js', pista: '...' }`,
   además de `titulo`, `subtitulo`, `fecha`, `intro`, `portada` y `carpetaFotos` (para la portada).
2. Genera el HTML del viaje (en Orlando: `python3 _fuente/build.py` dentro de su carpeta) y cífralo:

   ```bash
   node herramientas/cifrar-viaje.mjs orlando-2026 "/Users/gs/Downloads/orlando2026/Viaje Orlando 2026.html"
   ```

   La contraseña se lee de `respaldo/claves/<id>.txt`; si no existe, el script inventa una fácil de
   dictar, la guarda ahí y la imprime. Para cambiarla, borra ese archivo o pasa `--clave "nueva"` y
   vuelve a cifrar. Repite el comando cada vez que cambie el planificador.
3. Al abrir el viaje, la guía pide la contraseña, descifra en el navegador (AES-GCM con Web Crypto)
   y muestra el HTML dentro de un marco con su propio diseño. «Recordar en este dispositivo» guarda la
   contraseña en el navegador; el botón «Bloquear» la olvida.

Ni el HTML original ni los PDF deben copiarse a esta carpeta: solo se publica el archivo cifrado.

## Publicar

El sitio se sirve desde la rama `main` con GitHub Pages. Publicar es hacer push:

```bash
git add -A
git commit -m "Nuevas fotos"
git push
```

Primera vez (una sola):

```bash
gh auth login                      # o crea el repo vacío en github.com
gh repo create gabsau/lenygabo --public --source . --remote origin --push
gh api -X POST repos/gabsau/lenygabo/pages -f "source[branch]=main" -f "source[path]=/"
```

URL: https://gabsau.github.io/lenygabo/

## Dominio propio (cuando lo tengas)

1. Crea un archivo `CNAME` en la raíz con el dominio, por ejemplo `guia.lenygabo.com`.
2. En tu proveedor de DNS añade un registro `CNAME` de `guia` → `gabsau.github.io`.
   Para el dominio raíz (`lenygabo.com`) usa registros `A` a 185.199.108.153, 185.199.109.153,
   185.199.110.153 y 185.199.111.153.
3. En GitHub, Settings → Pages → Custom domain, escribe el dominio y activa "Enforce HTTPS".
4. Actualiza la URL de `og:image` en `index.html` para que la vista previa al compartir siga funcionando.

## Probar en local

```bash
python3 -m http.server 8080
```

y abre http://localhost:8080. También funciona abriendo `index.html` directamente.
