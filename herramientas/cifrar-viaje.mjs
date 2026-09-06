#!/usr/bin/env node
/**
 * Cifra el HTML de un viaje privado para publicarlo en la guía sin exponerlo.
 *
 *   node herramientas/cifrar-viaje.mjs <id-del-viaje> "<ruta al HTML>" [--clave "mi contraseña"]
 *
 *  - El viaje debe existir en datos.js con `privado: { archivo: '...' }`.
 *  - La contraseña se toma de --clave; si no, de respaldo/claves/<id>.txt; y si
 *    tampoco existe, se genera una fácil de dictar y se guarda ahí (respaldo/
 *    no se publica). Cambiar la contraseña = borrar ese archivo o pasar --clave.
 *  - Cifrado: AES-256-GCM con clave derivada por PBKDF2-SHA256 (300 000 vueltas).
 *    El navegador lo descifra con Web Crypto (app.js) y muestra el HTML en un iframe.
 *  - Se niega a cifrar una plantilla sin armar (con marcas <!--INJECT:...-->).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ITERACIONES = 300000;
const subtle = globalThis.crypto.subtle;

const args = process.argv.slice(2);
const iClave = args.indexOf('--clave');
const claveArg = iClave >= 0 ? args.splice(iClave, 2)[1] : null;
const [id, rutaHTML] = args;

if (!id || !rutaHTML) {
  console.error('Uso: node herramientas/cifrar-viaje.mjs <id-del-viaje> "<ruta al HTML>" [--clave "..."]');
  process.exit(1);
}

function leerDatos() {
  const codigo = fs.readFileSync(path.join(RAIZ, 'datos.js'), 'utf8');
  const contexto = { window: {} };
  vm.runInNewContext(codigo, contexto, { filename: 'datos.js' });
  return contexto.window.DATOS;
}

const PALABRAS = ['ola', 'faro', 'isla', 'brisa', 'coral', 'ancla', 'marea', 'arena', 'vela', 'timon', 'puerto',
  'barco', 'sol', 'luna', 'palma', 'concha', 'perla', 'delfin', 'gaviota', 'ballena', 'tortuga', 'estrella',
  'cielo', 'viento', 'nube', 'rio', 'monte', 'bosque', 'lago', 'playa', 'muelle', 'bahia', 'cabo', 'caracol'];

function claveNueva() {
  const al = (n) => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const a = PALABRAS[al(PALABRAS.length)];
  let b = PALABRAS[al(PALABRAS.length)];
  while (b === a) b = PALABRAS[al(PALABRAS.length)];
  return `${a}-${b}-${10 + al(90)}`;
}

const aB64 = (bytes) => Buffer.from(bytes).toString('base64');

async function cifrar(texto, clave) {
  const sal = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const material = await subtle.importKey('raw', new TextEncoder().encode(clave.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  const llave = await subtle.deriveKey(
    { name: 'PBKDF2', salt: sal, iterations: ITERACIONES, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
  const datos = await subtle.encrypt({ name: 'AES-GCM', iv }, llave, new TextEncoder().encode(texto));
  // Comprobación: lo que acabamos de cifrar se puede descifrar con la misma clave.
  const vuelta = await subtle.decrypt({ name: 'AES-GCM', iv }, llave, datos);
  if (new TextDecoder().decode(vuelta) !== texto) throw new Error('La comprobación de descifrado falló.');
  return { v: 1, kdf: 'PBKDF2-SHA256', iteraciones: ITERACIONES, sal: aB64(sal), iv: aB64(iv), datos: aB64(datos) };
}

async function main() {
  const datos = leerDatos();
  const viaje = (datos.viajes || []).find((v) => v.id === id);
  if (!viaje) { console.error(`✖ No hay ningún viaje con id "${id}" en datos.js.`); process.exit(1); }
  if (!viaje.privado) { console.error(`✖ El viaje "${viaje.titulo}" no tiene \`privado\` en datos.js.`); process.exit(1); }

  const origen = path.resolve(rutaHTML);
  if (!fs.existsSync(origen)) { console.error(`✖ No existe ${origen}`); process.exit(1); }
  const html = fs.readFileSync(origen, 'utf8');
  if (html.includes('<!--INJECT:')) {
    console.error('✖ Ese archivo es la plantilla sin armar (tiene marcas INJECT). Corre su build.py y cifra el HTML resultante.');
    process.exit(1);
  }

  const archivoClave = path.join(RAIZ, 'respaldo', 'claves', `${id}.txt`);
  let clave = claveArg;
  let origenClave = '--clave';
  if (!clave && fs.existsSync(archivoClave)) { clave = fs.readFileSync(archivoClave, 'utf8').trim(); origenClave = path.relative(RAIZ, archivoClave); }
  if (!clave) { clave = claveNueva(); origenClave = 'nueva'; }
  fs.mkdirSync(path.dirname(archivoClave), { recursive: true });
  fs.writeFileSync(archivoClave, `${clave}\n`);

  const paquete = await cifrar(html, clave);
  const salida = path.join(RAIZ, viaje.privado.archivo || `viajes/${id}.cifrado.js`);
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, [
    '// GENERADO por herramientas/cifrar-viaje.mjs — contenido cifrado (AES-GCM). No edites a mano.',
    `// Origen: ${path.basename(origen)} · ${new Date().toISOString().slice(0, 10)}`,
    'window.CIFRADO = window.CIFRADO || {};',
    `window.CIFRADO[${JSON.stringify(id)}] = ${JSON.stringify(paquete)};`,
    '',
  ].join('\n'));

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  console.log(`✔ ${path.relative(RAIZ, salida)} (${mb(fs.statSync(salida).size)}) a partir de ${path.basename(origen)} (${mb(Buffer.byteLength(html))})`);
  if (origenClave === 'nueva') console.log(`  Contraseña NUEVA: ${clave}   (guardada en ${path.relative(RAIZ, archivoClave)})`);
  else console.log(`  Contraseña: la de ${origenClave} (guardada en ${path.relative(RAIZ, archivoClave)})`);
}

main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
