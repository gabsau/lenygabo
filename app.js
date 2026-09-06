/* ============================================================================
   Guía de viajes de Leny & Gabo — app.js
   Router por hash (#/, #/viaje, #/viaje/seccion), render de portada y viajes,
   mosaicos de fotos, visor a pantalla completa y viajes privados cifrados
   (se abren con contraseña en el navegador). Sin dependencias.
   ========================================================================== */
(() => {
  'use strict';

  const app = document.getElementById('app');
  const visor = document.getElementById('visor');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Utilidades ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const icono = (trazo, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trazo}${extra}</svg>`;
  const ICONO = {
    pin: icono('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/>', '<circle cx="12" cy="10" r="2.5"/>'),
    volver: icono('<path d="M15 18l-6-6 6-6"/>'),
    cerrar: icono('<path d="M18 6 6 18M6 6l12 12"/>'),
    anterior: icono('<path d="M15 18l-6-6 6-6"/>'),
    siguiente: icono('<path d="M9 18l6-6-6-6"/>'),
    flecha: icono('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    candado: icono('<rect x="4" y="11" width="16" height="10" rx="1.5"/>', '<path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    abierto: icono('<rect x="4" y="11" width="16" height="10" rx="1.5"/>', '<path d="M8 11V7a4 4 0 0 1 7.6-1.7"/>'),
    ojo: icono('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/>', '<circle cx="12" cy="12" r="3"/>'),
  };
  const aviso = (titulo, texto) =>
    `<div class="aviso" role="alert"><strong>${titulo}</strong><span>${texto}</span></div>`;

  // ---------- Datos ----------
  const DATOS = window.DATOS;
  const FOTOS = window.FOTOS;

  if (!DATOS || !Array.isArray(DATOS.viajes)) {
    app.innerHTML = aviso(
      'No se pudo cargar <code>datos.js</code>.',
      'Suele ser una coma o una comilla fuera de lugar. La consola del navegador indica la línea exacta.'
    );
    return;
  }
  const avisoFotos = FOTOS ? '' : aviso(
    'No se cargó <code>fotos.js</code>.',
    'Ejecuta <code>node herramientas/actualizar-fotos.mjs</code> para generarlo. Mientras, la guía se muestra sin fotos.'
  );

  const fotosDe = (viaje, lugar) => ((FOTOS || {})[viaje.id] || {})[lugar.id] || [];
  const seccionesDe = (viaje) => viaje.secciones || [];
  const lugaresDe = (viaje) => seccionesDe(viaje).flatMap((s) => s.lugares || []);
  // Lugares y bebidas: todo lo que puede llevar fotos.
  const conFotos = (viaje) => seccionesDe(viaje).flatMap((s) => [...(s.lugares || []), ...(s.bebidas || [])]);
  const totalFotos = (viaje) => conFotos(viaje).reduce((n, l) => n + fotosDe(viaje, l).length, 0);

  // ---------- Plantillas ----------
  const pie = () => `
    <footer class="pie contenedor">
      <p>${esc(DATOS.marca)} · Guía de viajes</p>
      ${DATOS.pie ? `<p>${esc(DATOS.pie)}</p>` : ''}
    </footer>`;

  const tarjetaViaje = (v) => {
    const datos = v.privado
      ? `${ICONO.candado}Viaje privado · se abre con contraseña`
      : `${plural(lugaresDe(v).length, 'lugar', 'lugares')} · ${plural(totalFotos(v), 'foto', 'fotos')}`;
    return `
      <a class="viaje${v.privado ? ' privado' : ''}" href="#/${esc(v.id)}">
        <div class="viaje-foto">${v.portada ? `<img src="${esc(v.portada)}" alt="" decoding="async">` : ''}</div>
        <div class="viaje-texto">
          <h3>${esc(v.titulo)}</h3>
          <p class="viaje-sub">${esc(v.subtitulo)}${v.fecha ? ` · ${esc(v.fecha)}` : ''}</p>
          ${v.intro ? `<p class="viaje-intro">${esc(v.intro)}</p>` : ''}
          <p class="viaje-datos">${datos}</p>
          <span class="viaje-abrir">${v.privado ? 'Abrir el viaje' : 'Abrir la guía'} ${ICONO.flecha}</span>
        </div>
      </a>`;
  };

  const barra = (extra = '') => `
    <nav class="barra" aria-label="Principal">
      <div class="contenedor barra-interior">
        <a class="barra-volver" href="#/">${ICONO.volver}<span>Viajes</span></a>
        <div class="barra-derecha"><a class="barra-marca" href="#/">${esc(DATOS.marca)}</a>${extra}</div>
      </div>
    </nav>`;

  const cabeceraViaje = (viaje) => `
    <header class="viaje-cabecera contenedor">
      ${viaje.portada ? `<div class="viaje-portada"><img src="${esc(viaje.portada)}" alt="" decoding="async"></div>` : ''}
      <div class="viaje-titular">
        <h1>${esc(viaje.titulo)}</h1>
        <p class="viaje-sub">${esc(viaje.subtitulo)}${viaje.fecha ? ` · ${esc(viaje.fecha)}` : ''}</p>
        ${viaje.intro ? `<p class="viaje-intro">${esc(viaje.intro)}</p>` : ''}
      </div>
    </header>`;

  const mosaico = (lugar, fotos) => {
    const n = Math.min(fotos.length, 4);
    const celdas = fotos.slice(0, n).map((f, i) => {
      const etiqueta = `Ver foto ${i + 1} de ${fotos.length}${f.pie ? `: ${f.pie}` : ` de ${lugar.nombre}`}`;
      const mas = i === n - 1 && fotos.length > n
        ? `<span class="foto-mas" aria-hidden="true">+${fotos.length - n}</span>`
        : '';
      return `
        <button type="button" class="foto" data-indice="${i}" aria-label="${esc(etiqueta)}">
          <img src="${esc(f.src)}" alt="" loading="lazy" decoding="async">${mas}
        </button>`;
    }).join('');
    return `<div class="mosaico" data-n="${n}" data-lugar="${esc(lugar.id)}">${celdas}</div>`;
  };

  const tarjetaLugar = (viaje, l) => {
    const fotos = fotosDe(viaje, l);
    const meta = [l.tipo, l.zona].filter(Boolean).map(esc).join(' · ');
    const platos = l.platos && l.platos.length
      ? `<ul class="platos">${l.platos.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`
      : '';
    const ubicacion = l.direccion || l.maps ? `
      <div class="ubicacion">
        ${l.direccion ? `<address>${esc(l.direccion)}${l.cp ? `<br>${esc(l.cp)}` : ''}</address>` : ''}
        ${l.maps ? `<a class="boton" href="${esc(l.maps)}" target="_blank" rel="noopener" aria-label="Ver ${esc(l.nombre)} en Google Maps">${ICONO.pin}<span>Ver en Google Maps</span></a>` : ''}
      </div>` : '';
    return `
      <article class="lugar${fotos.length ? '' : ' sin-fotos'}" id="lugar-${esc(l.id)}">
        ${fotos.length ? mosaico(l, fotos) : ''}
        <div class="lugar-cuerpo">
          <div>
            <h3>${esc(l.nombre)}</h3>
            ${meta ? `<p class="lugar-tipo">${meta}</p>` : ''}
          </div>
          ${platos}
          ${ubicacion}
        </div>
      </article>`;
  };

  const zonaComun = (lugares) => {
    const zonas = new Set(lugares.map((l) => l.zona).filter(Boolean));
    return zonas.size === 1 && lugares.length > 1 ? ` · ${esc([...zonas][0])}` : '';
  };

  const seccionHTML = (viaje, s) => {
    if (s.bebidas) {
      return `
        <div class="seccion-cabecera">
          <h2>${esc(s.titulo)}</h2>
          ${s.descripcion ? `<p>${esc(s.descripcion)}</p>` : ''}
        </div>
        <div class="bebidas">
          ${s.bebidas.map((b) => {
            const fotos = fotosDe(viaje, b);
            return `
              <article class="bebida${fotos.length ? ' con-fotos' : ''}">
                ${fotos.length ? mosaico(b, fotos) : ''}
                <div class="bebida-cuerpo"><h3>${esc(b.nombre)}</h3><p>${esc(b.texto)}</p></div>
              </article>`;
          }).join('')}
        </div>`;
    }
    const lugares = s.lugares || [];
    return `
      <div class="seccion-cabecera">
        <h2>${esc(s.titulo)}</h2>
        <p>${plural(lugares.length, 'lugar', 'lugares')}${zonaComun(lugares)}</p>
      </div>
      <div class="lugares">${lugares.map((l) => tarjetaLugar(viaje, l)).join('')}</div>`;
  };

  // ---------- Vistas ----------
  let viajeActual = null;
  let lugaresPorId = new Map();

  const enfocarTitulo = () => {
    const h1 = app.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
  };

  function renderPortada() {
    document.title = `${DATOS.marca} · Guía de viajes`;
    viajeActual = null;
    lugaresPorId = new Map();
    delete app.dataset.viaje;
    app.dataset.vista = 'portada';
    const unico = DATOS.viajes.length === 1;
    app.innerHTML = `
      ${avisoFotos}
      <header class="portada contenedor">
        <h1>${esc(DATOS.marca)}</h1>
        ${DATOS.descripcion ? `<p class="portada-texto">${esc(DATOS.descripcion)}</p>` : ''}
      </header>
      <main class="viajes contenedor">
        <h2>${unico ? 'Nuestro primer viaje' : 'Viajes'}</h2>
        <div class="viajes-lista${unico ? ' unico' : ''}">${DATOS.viajes.map(tarjetaViaje).join('')}</div>
      </main>
      ${pie()}`;
    window.scrollTo(0, 0);
    enfocarTitulo();
  }

  function renderViaje(viaje, seccion) {
    const mismo = app.dataset.viaje === viaje.id;
    document.title = `${viaje.titulo} · ${DATOS.marca}`;

    if (!mismo) {
      viajeActual = viaje;
      lugaresPorId = new Map(conFotos(viaje).map((l) => [l.id, l]));
      app.dataset.vista = 'viaje';
      app.dataset.viaje = viaje.id;
      const pestanas = seccionesDe(viaje).map((s) => `
        <a role="tab" id="tab-${esc(s.id)}" class="pestana" href="#/${esc(viaje.id)}/${esc(s.id)}"
           aria-controls="panel" aria-selected="false" tabindex="-1">${esc(s.corto || s.titulo)}</a>`).join('');
      app.innerHTML = `
        ${avisoFotos}
        ${barra()}
        ${cabeceraViaje(viaje)}
        <div class="ancla-pestanas"></div>
        <div class="pestanas">
          <div class="contenedor">
            <div class="pestanas-lista" role="tablist" aria-label="Secciones de ${esc(viaje.titulo)}">${pestanas}</div>
          </div>
        </div>
        <main id="panel" class="contenedor" role="tabpanel"></main>
        ${pie()}`;
      window.scrollTo(0, 0);
      enfocarTitulo();
    }

    const panelVacio = document.getElementById('panel');
    if (!seccion) {
      panelVacio.innerHTML = aviso('Este viaje no tiene secciones todavía.', 'Añádelas en <code>datos.js</code>.');
      return;
    }
    app.querySelectorAll('.pestana').forEach((p) => {
      const activa = p.id === `tab-${seccion.id}`;
      p.setAttribute('aria-selected', String(activa));
      p.tabIndex = activa ? 0 : -1;
    });
    const panel = document.getElementById('panel');
    panel.setAttribute('aria-labelledby', `tab-${seccion.id}`);
    panel.innerHTML = seccionHTML(viaje, seccion);

    if (mismo) {
      // Al cambiar de pestaña estando abajo, vuelve al inicio de la sección.
      const ancla = app.querySelector('.ancla-pestanas');
      const barra = app.querySelector('.barra');
      const tope = ancla.getBoundingClientRect().top + window.scrollY - (barra ? barra.offsetHeight : 0);
      if (window.scrollY > tope) window.scrollTo({ top: tope, behavior: 'auto' });
    }
  }

  // ---------- Viajes privados (cifrados; se abren con contraseña) ----------
  // El contenido es un HTML completo cifrado con AES-GCM (clave derivada con
  // PBKDF2) por herramientas/cifrar-viaje.mjs. Se descifra en el navegador y
  // se muestra dentro de un iframe para que conserve su propio diseño.
  const CLAVE_PREFIJO = 'lenygabo.clave.';
  const paquetes = new Map(); // id del viaje → Promise con el paquete cifrado

  function cargarCifrado(viaje) {
    if (!paquetes.has(viaje.id)) {
      const promesa = new Promise((resolver, rechazar) => {
        const paquete = () => (window.CIFRADO || {})[viaje.id];
        if (paquete()) { resolver(paquete()); return; }
        const s = document.createElement('script');
        s.src = viaje.privado.archivo;
        s.onload = () => (paquete() ? resolver(paquete()) : rechazar(new Error('El archivo cifrado no contiene este viaje.')));
        s.onerror = () => rechazar(new Error(`No se pudo descargar ${viaje.privado.archivo}. Revisa la conexión e inténtalo de nuevo.`));
        document.head.appendChild(s);
      });
      promesa.catch(() => paquetes.delete(viaje.id)); // permite reintentar
      paquetes.set(viaje.id, promesa);
    }
    return paquetes.get(viaje.id);
  }

  const desdeB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function descifrar(paquete, clave) {
    const subtle = (window.crypto || {}).subtle;
    if (!subtle) throw new Error('Este navegador solo puede abrir el viaje desde una dirección https o desde el archivo local.');
    const material = await subtle.importKey('raw', new TextEncoder().encode(clave.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
    const llave = await subtle.deriveKey(
      { name: 'PBKDF2', salt: desdeB64(paquete.sal), iterations: paquete.iteraciones, hash: 'SHA-256' },
      material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    const plano = await subtle.decrypt({ name: 'AES-GCM', iv: desdeB64(paquete.iv) }, llave, desdeB64(paquete.datos));
    return new TextDecoder().decode(plano);
  }

  const claveGuardada = (id) => {
    try { return localStorage.getItem(CLAVE_PREFIJO + id) || sessionStorage.getItem(CLAVE_PREFIJO + id); } catch { return null; }
  };
  const guardarClave = (id, clave, enDispositivo) => {
    try {
      sessionStorage.setItem(CLAVE_PREFIJO + id, clave);
      if (enDispositivo) localStorage.setItem(CLAVE_PREFIJO + id, clave);
    } catch { /* almacenamiento bloqueado: se pedirá otra vez */ }
  };
  const olvidarClave = (id) => {
    try { localStorage.removeItem(CLAVE_PREFIJO + id); sessionStorage.removeItem(CLAVE_PREFIJO + id); } catch { /* nada */ }
  };

  function renderPrivado(viaje) {
    document.title = `${viaje.titulo} · ${DATOS.marca}`;
    viajeActual = null;
    lugaresPorId = new Map();
    app.dataset.vista = 'privado';
    app.dataset.viaje = viaje.id;
    app.innerHTML = `
      ${barra()}
      ${cabeceraViaje(viaje)}
      <main class="contenedor">
        <section class="candado" aria-labelledby="candado-titulo">
          <div class="candado-icono">${ICONO.candado}</div>
          <div class="candado-texto">
            <h2 id="candado-titulo">Este viaje es privado</h2>
            <p>Tiene los vuelos, los camarotes y las confirmaciones de la familia, así que se abre con contraseña.</p>
            <form class="candado-form" novalidate>
              <label class="candado-etiqueta" for="candado-clave">Contraseña</label>
              <div class="candado-campo">
                <input id="candado-clave" name="clave" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" required>
                <button type="button" class="candado-ver" aria-label="Mostrar contraseña" aria-pressed="false">${ICONO.ojo}</button>
              </div>
              <label class="candado-recordar"><input type="checkbox" name="recordar"> Recordar en este dispositivo</label>
              <button type="submit" class="boton candado-abrir">${ICONO.abierto}<span>Abrir el viaje</span></button>
              <p class="candado-error" role="alert"></p>
            </form>
            ${viaje.privado.pista ? `<p class="candado-pista">${esc(viaje.privado.pista)}</p>` : ''}
          </div>
        </section>
      </main>
      ${pie()}`;
    window.scrollTo(0, 0);
    enfocarTitulo();

    const form = app.querySelector('.candado-form');
    const campo = form.elements.clave;
    const recordar = form.elements.recordar;
    const error = form.querySelector('.candado-error');
    const abrir = form.querySelector('.candado-abrir');
    const ver = form.querySelector('.candado-ver');
    cargarCifrado(viaje).catch(() => {}); // empieza a descargar mientras se escribe la contraseña

    ver.addEventListener('click', () => {
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      ver.setAttribute('aria-pressed', String(mostrar));
      ver.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
      campo.focus();
    });

    const ocupado = (si) => {
      abrir.disabled = si;
      campo.readOnly = si;
      abrir.querySelector('span').textContent = si ? 'Abriendo…' : 'Abrir el viaje';
    };

    async function intentar(clave, enDispositivo, automatico) {
      error.textContent = '';
      ocupado(true);
      try {
        const paquete = await cargarCifrado(viaje);
        const html = await descifrar(paquete, clave);
        if (app.dataset.viaje !== viaje.id || app.dataset.vista !== 'privado') return; // ya se navegó a otro lado
        guardarClave(viaje.id, clave, enDispositivo);
        mostrarPrivado(viaje, html);
      } catch (e) {
        if (app.dataset.viaje !== viaje.id || app.dataset.vista !== 'privado') return;
        ocupado(false);
        if (automatico) { olvidarClave(viaje.id); campo.value = ''; return; }
        error.textContent = e && e.name === 'OperationError'
          ? 'Esa contraseña no es. Revisa mayúsculas, guiones y espacios.'
          : (e && e.message) || 'No se pudo abrir el viaje.';
        campo.focus();
        campo.select();
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const clave = campo.value.trim();
      if (!clave) { error.textContent = 'Escribe la contraseña.'; campo.focus(); return; }
      intentar(clave, recordar.checked, false);
    });

    const previa = claveGuardada(viaje.id);
    if (previa) { campo.value = previa; intentar(previa, false, true); }
  }

  function mostrarPrivado(viaje, html) {
    app.dataset.vista = 'privado-abierto';
    app.innerHTML = `
      ${barra(`<button type="button" class="barra-bloquear">${ICONO.candado}<span>Bloquear</span></button>`)}
      <div class="privado-pantalla"><iframe class="privado-marco" title="${esc(viaje.titulo)}"></iframe></div>`;
    app.querySelector('.privado-marco').srcdoc = html;
    app.querySelector('.barra-bloquear').addEventListener('click', () => {
      olvidarClave(viaje.id);
      renderPrivado(viaje);
    });
    window.scrollTo(0, 0);
  }

  // ---------- Router ----------
  function render() {
    const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const viaje = DATOS.viajes.find((v) => v.id === partes[0]);
    if (!viaje) {
      renderPortada();
      return;
    }
    if (viaje.privado) {
      // Si ya está abierto, no se vuelve a pedir la contraseña por un cambio de hash.
      if (app.dataset.viaje === viaje.id && app.dataset.vista === 'privado-abierto') return;
      renderPrivado(viaje);
      return;
    }
    const secciones = seccionesDe(viaje);
    const seccion = secciones.find((s) => s.id === partes[1]) || secciones[0];
    renderViaje(viaje, seccion);
  }
  window.addEventListener('hashchange', render);
  render();

  // Teclado en las pestañas: flechas, Inicio y Fin.
  app.addEventListener('keydown', (e) => {
    const lista = e.target.closest && e.target.closest('[role="tablist"]');
    if (!lista) return;
    const tabs = [...lista.querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(e.target);
    if (i < 0) return;
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const tab = tabs[(destino + tabs.length) % tabs.length];
    tab.focus();
    tab.click();
  });

  // Fotos que no cargan: la celda avisa en vez de quedar rota.
  app.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const celda = img.closest('.foto');
    if (celda) celda.classList.add('rota');
    const banner = img.closest('.viaje-portada, .viaje-foto');
    if (banner) banner.remove();
  }, true);

  // ---------- Visor ----------
  const pista = visor.querySelector('.visor-pista');
  const vTitulo = visor.querySelector('.visor-titulo');
  const vContador = visor.querySelector('.visor-contador');
  const btnAnterior = visor.querySelector('.visor-prev');
  const btnSiguiente = visor.querySelector('.visor-next');
  const btnCerrar = visor.querySelector('.visor-cerrar');
  let estado = { fotos: [], indice: 0, origen: null, enHistorial: false };
  let observador = null;

  function saltarA(i, suave = false) {
    const destino = pista.children[i];
    if (!destino) return;
    pista.scrollTo({ left: destino.offsetLeft, behavior: suave && !reducido.matches ? 'smooth' : 'auto' });
  }

  function actualizarIndice(i) {
    estado.indice = i;
    vContador.textContent = `${i + 1} / ${estado.fotos.length}`;
    btnAnterior.disabled = i === 0;
    btnSiguiente.disabled = i === estado.fotos.length - 1;
  }

  function abrirVisor(lugar, fotos, indice, origen) {
    vTitulo.textContent = lugar.nombre;
    pista.innerHTML = fotos.map((f, i) => `
      <figure class="visor-foto" data-indice="${i}">
        <img src="${esc(f.src)}" alt="${esc(f.pie || lugar.nombre)}" loading="${Math.abs(i - indice) <= 1 ? 'eager' : 'lazy'}" decoding="async">
        ${f.pie ? `<figcaption>${esc(f.pie)}</figcaption>` : ''}
      </figure>`).join('');
    estado = { fotos, indice, origen, enHistorial: true };
    visor.showModal();
    saltarA(indice);
    actualizarIndice(indice);
    if (observador) observador.disconnect();
    observador = new IntersectionObserver((entradas) => {
      for (const en of entradas) {
        if (en.isIntersecting) actualizarIndice(Number(en.target.dataset.indice));
      }
    }, { root: pista, threshold: 0.6 });
    [...pista.children].forEach((f) => observador.observe(f));
    history.pushState({ visor: true }, '');
  }

  app.addEventListener('click', (e) => {
    const celda = e.target.closest('.foto');
    if (!celda || celda.classList.contains('rota') || !viajeActual) return;
    const lugar = lugaresPorId.get(celda.closest('.mosaico').dataset.lugar);
    if (!lugar) return;
    abrirVisor(lugar, fotosDe(viajeActual, lugar), Number(celda.dataset.indice), celda);
  });

  btnAnterior.addEventListener('click', () => saltarA(estado.indice - 1, true));
  btnSiguiente.addEventListener('click', () => saltarA(estado.indice + 1, true));
  btnCerrar.addEventListener('click', () => visor.close());

  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); saltarA(estado.indice + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); saltarA(estado.indice - 1, true); }
  });

  // Tocar fuera de la foto (fondo oscuro) cierra el visor.
  visor.addEventListener('click', (e) => {
    if (e.target === visor || e.target === pista || e.target.classList.contains('visor-foto')) visor.close();
  });

  visor.addEventListener('close', () => {
    if (observador) { observador.disconnect(); observador = null; }
    pista.innerHTML = '';
    if (estado.enHistorial) { estado.enHistorial = false; history.back(); }
    if (estado.origen && estado.origen.isConnected) estado.origen.focus({ preventScroll: true });
  });

  // El gesto/botón "atrás" cierra el visor sin salir de la página.
  window.addEventListener('popstate', () => {
    if (visor.open) { estado.enHistorial = false; visor.close(); }
  });
  window.addEventListener('resize', () => { if (visor.open) saltarA(estado.indice); });
})();
