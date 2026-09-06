#!/usr/bin/env node
/**
 * Actualiza fotos.js a partir de las carpetas de fotos de cada viaje.
 *
 *   node herramientas/actualizar-fotos.mjs                 escanea, optimiza y reescribe fotos.js
 *   node herramientas/actualizar-fotos.mjs --sin-optimizar  igual, pero sin tocar las imágenes
 *
 * Convención:  <carpetaFotos del viaje>/<NOMBRE DEL LUGAR>/foto.jpg
 *  - El nombre de la carpeta se compara con `nombre` y `alias` de cada lugar
 *    de datos.js ignorando mayúsculas, acentos y signos.
 *  - Las carpetas con "PORTADA" en el nombre y los archivos sueltos en la raíz
 *    de carpetaFotos se ignoran.
 *  - Se conservan el orden y los pies de foto ("pie") ya escritos en fotos.js.
 *  - Las fotos pesadas (> 600 KB o > 1600 px) se reducen con `sips` (macOS);
 *    el original se guarda en respaldo/originales/ (carpeta fuera del sitio).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO_DATOS = path.join(RAIZ, 'datos.js');
const ARCHIVO_FOTOS = path.join(RAIZ, 'fotos.js');
const CARPETA_RESPALDO = path.join(RAIZ, 'respaldo', 'originales');
const ES_IMAGEN = /\.(jpe?g|png|webp|gif|avif)$/i;
const NO_ES_WEB = /\.(heic|heif|tiff?|dng|raw|mov|mp4)$/i;
const LADO_MAX = 1600;          // píxeles del lado mayor
const PESO_MAX = 600 * 1024;    // bytes
const CALIDAD_JPEG = 82;
const OPTIMIZAR = !process.argv.includes('--sin-optimizar') && process.platform === 'darwin';

const avisos = [];
const infos = [];
const aviso = (m) => avisos.push(m);
const info = (m) => infos.push(m);
const normalizar = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const kb = (b) => `${Math.round(b / 1024)} KB`;

function leerDatos() {
  const codigo = fs.readFileSync(ARCHIVO_DATOS, 'utf8');
  const contexto = { window: {} };
  try {
    vm.runInNewContext(codigo, contexto, { filename: 'datos.js' });
  } catch (e) {
    console.error(`✖ datos.js tiene un error de sintaxis: ${e.message}`);
    process.exit(1);
  }
  const datos = contexto.window.DATOS;
  if (!datos || !Array.isArray(datos.viajes)) {
    console.error('✖ datos.js no define window.DATOS.viajes');
    process.exit(1);
  }
  return datos;
}

function leerFotosPrevias() {
  if (!fs.existsSync(ARCHIVO_FOTOS)) return {};
  const texto = fs.readFileSync(ARCHIVO_FOTOS, 'utf8');
  const ini = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (ini < 0 || fin < 0) return {};
  try {
    return JSON.parse(texto.slice(ini, fin + 1));
  } catch (e) {
    console.error(`✖ No pude leer fotos.js (${e.message}).`);
    console.error('  Corrige la sintaxis (suele ser una comilla dentro de un "pie") o borra el archivo para regenerarlo sin pies de foto.');
    process.exit(1);
  }
}

function dimensiones(ruta) {
  try {
    const salida = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', ruta], { encoding: 'utf8' });
    return {
      w: Number(/pixelWidth:\s*(\d+)/.exec(salida)?.[1] || 0),
      h: Number(/pixelHeight:\s*(\d+)/.exec(salida)?.[1] || 0),
    };
  } catch {
    return { w: 0, h: 0 };
  }
}

/** Reduce una foto pesada en su sitio y guarda el original en respaldo/originales. */
function optimizar(rutaAbs) {
  const peso = fs.statSync(rutaAbs).size;
  const { w, h } = dimensiones(rutaAbs);
  if (peso <= PESO_MAX && Math.max(w, h) <= LADO_MAX) return false;

  const rel = path.relative(RAIZ, rutaAbs);
  const copia = path.join(CARPETA_RESPALDO, rel);
  if (!fs.existsSync(copia)) {
    fs.mkdirSync(path.dirname(copia), { recursive: true });
    fs.copyFileSync(rutaAbs, copia);
  }

  const temporal = path.join(path.dirname(rutaAbs), `.optimizando-${path.basename(rutaAbs)}`);
  const esJpeg = /\.jpe?g$/i.test(rutaAbs);
  const args = ['-Z', String(LADO_MAX)];
  if (esJpeg) args.push('-s', 'format', 'jpeg', '-s', 'formatOptions', String(CALIDAD_JPEG));
  args.push(rutaAbs, '--out', temporal);
  try {
    execFileSync('sips', args, { stdio: 'ignore' });
  } catch (e) {
    fs.rmSync(temporal, { force: true });
    aviso(`No pude optimizar ${rel}: ${e.message}`);
    return false;
  }
  const nuevoPeso = fs.statSync(temporal).size;
  if (nuevoPeso >= peso) {
    fs.rmSync(temporal);
    return false;
  }
  fs.renameSync(temporal, rutaAbs);
  info(`Optimizada ${rel}: ${kb(peso)} → ${kb(nuevoPeso)} (original en respaldo/originales)`);
  return true;
}

function distancia(a, b) {
  const m = a.length, n = b.length;
  const fila = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = fila[0];
    fila[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return fila[n];
}

function sugerencia(clave, nombreCarpeta, lugares) {
  let mejor = null;
  for (const l of lugares) {
    const k = normalizar(l.nombre);
    const d = k.includes(clave) || clave.includes(k) ? 0 : distancia(clave, k);
    if (d <= 2 && (!mejor || d < mejor.d)) mejor = { l, d };
  }
  return mejor
    ? ` ¿Quisiste decir "${mejor.l.nombre}"? Añade alias: ['${nombreCarpeta}'] a ese lugar en datos.js, o renombra la carpeta.`
    : ' Comprueba el nombre en datos.js o añade el lugar.';
}

function escribir(resultado) {
  const lineas = [
    '// GENERADO por herramientas/actualizar-fotos.mjs — no edites las rutas a mano.',
    '// Sí puedes cambiar el orden de las fotos y escribir los pies de foto en "pie".',
    'window.FOTOS = {',
  ];
  const viajes = Object.keys(resultado);
  viajes.forEach((v, i) => {
    lineas.push(`  ${JSON.stringify(v)}: {`);
    const lugares = Object.keys(resultado[v]);
    lugares.forEach((l, j) => {
      const fotos = resultado[v][l];
      lineas.push(`    ${JSON.stringify(l)}: [`);
      fotos.forEach((f, k) => {
        lineas.push(`      ${JSON.stringify({ src: f.src, pie: f.pie || '' })}${k < fotos.length - 1 ? ',' : ''}`);
      });
      lineas.push(`    ]${j < lugares.length - 1 ? ',' : ''}`);
    });
    lineas.push(`  }${i < viajes.length - 1 ? ',' : ''}`);
  });
  lineas.push('};', '');
  fs.writeFileSync(ARCHIVO_FOTOS, lineas.join('\n'));
}

function main() {
  const datos = leerDatos();
  const previas = leerFotosPrevias();
  const resultado = {};
  let totalFotos = 0;
  let totalLugares = 0;
  let optimizadas = 0;

  for (const viaje of datos.viajes) {
    if (!viaje.carpetaFotos) {
      aviso(`El viaje "${viaje.titulo}" no tiene carpetaFotos; se omite.`);
      continue;
    }
    const carpeta = path.join(RAIZ, viaje.carpetaFotos);
    if (!fs.existsSync(carpeta)) {
      aviso(`No existe la carpeta ${viaje.carpetaFotos} del viaje "${viaje.titulo}".`);
      continue;
    }

    const lugares = viaje.secciones.flatMap((s) => s.lugares || []);
    const indice = new Map();
    for (const l of lugares) {
      indice.set(normalizar(l.nombre), l);
      for (const a of l.alias || []) indice.set(normalizar(a), l);
    }

    const porLugar = {};
    const subcarpetas = fs
      .readdirSync(carpeta, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort();

    for (const nombreCarpeta of subcarpetas) {
      const clave = normalizar(nombreCarpeta);
      if (clave.includes('PORTADA')) continue;
      const lugar = indice.get(clave);
      if (!lugar) {
        aviso(`La carpeta "${viaje.carpetaFotos}/${nombreCarpeta}" no coincide con ningún lugar.${sugerencia(clave, nombreCarpeta, lugares)}`);
        continue;
      }

      const dir = path.join(carpeta, nombreCarpeta);
      const archivos = fs.readdirSync(dir).filter((a) => !a.startsWith('.'));
      for (const a of archivos) {
        if (NO_ES_WEB.test(a)) aviso(`${nombreCarpeta}/${a} no se puede mostrar en el navegador; conviértelo a JPG.`);
      }
      const imagenes = archivos.filter((a) => ES_IMAGEN.test(a)).sort();
      if (!imagenes.length) {
        info(`La carpeta ${nombreCarpeta} no tiene imágenes.`);
        continue;
      }
      if (OPTIMIZAR) {
        for (const a of imagenes) if (optimizar(path.join(dir, a))) optimizadas++;
      }

      const rutaRel = (a) => `${viaje.carpetaFotos}/${nombreCarpeta}/${a}`;
      const anteriores = (previas[viaje.id]?.[lugar.id] || []).map((f) => (typeof f === 'string' ? { src: f, pie: '' } : f));
      const lista = [];
      for (const f of anteriores) {
        const base = path.basename(f.src);
        if (imagenes.includes(base)) lista.push({ src: rutaRel(base), pie: f.pie || '' });
        else if (!porLugar[lugar.id]) aviso(`Se quitó de fotos.js una foto que ya no existe: ${f.src}`);
      }
      for (const a of imagenes) {
        if (!lista.some((f) => path.basename(f.src) === a)) lista.push({ src: rutaRel(a), pie: '' });
      }
      porLugar[lugar.id] = (porLugar[lugar.id] || []).concat(lista);
      totalFotos += lista.length;
    }

    for (const l of lugares) {
      if (porLugar[l.id]) totalLugares++;
      else info(`Sin fotos todavía: ${l.nombre}`);
    }

    if (viaje.portada) {
      const p = path.join(RAIZ, viaje.portada);
      if (!fs.existsSync(p)) aviso(`No existe la portada ${viaje.portada} del viaje "${viaje.titulo}".`);
      else if (OPTIMIZAR && optimizar(p)) optimizadas++;
    }

    resultado[viaje.id] = porLugar;
  }

  escribir(resultado);

  console.log(`✔ fotos.js actualizado: ${totalLugares} lugares con fotos, ${totalFotos} fotos${optimizadas ? ` (${optimizadas} optimizadas)` : ''}`);
  for (const m of infos) console.log(`  · ${m}`);
  for (const m of avisos) console.warn(`⚠ ${m}`);
  if (!OPTIMIZAR && process.platform !== 'darwin') console.log('  (la optimización de fotos solo está disponible en macOS)');
}

main();
