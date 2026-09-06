// ============================================================================
//  Guía de viajes de Leny & Gabo — DATOS
//  Edita este archivo para añadir viajes, lugares, platos o textos.
//  Las FOTOS no se listan aquí: se generan en fotos.js con
//      node herramientas/actualizar-fotos.mjs
//  Convención de carpetas:  <carpetaFotos>/<NOMBRE DEL LUGAR>/foto.jpg
//  El nombre de la carpeta se compara con `nombre` y `alias` de cada lugar
//  sin importar mayúsculas, acentos ni signos.
// ============================================================================
window.DATOS = {
  marca: 'Leny & Gabo',
  descripcion: 'Nuestra guía de viajes: dónde comimos, qué pedimos y qué repetiríamos.',
  pie: 'Para nuestros amigos · 2026',

  viajes: [
    {
      id: 'san-sebastian',
      titulo: 'San Sebastián',
      subtitulo: 'Donostia · País Vasco',
      fecha: 'Septiembre 2026',
      intro: 'Pintxos, txacoli y la Parte Vieja: nuestros favoritos y los lugares que probamos.',
      portada: 'IMAGENES/SAN SEBASTIAN/PORTADA.jpg',
      carpetaFotos: 'IMAGENES/SAN SEBASTIAN',

      secciones: [
        {
          id: 'favoritos',
          titulo: 'Nuestros favoritos',
          corto: 'Favoritos',
          lugares: [
            {
              id: 'la-cuchara-de-san-telmo',
              nombre: 'La Cuchara de San Telmo',
              tipo: 'Pintxos creativos',
              zona: 'Parte Vieja',
              alias: ['CUCHARADA DE SAN TELMO', 'CUCHARA DE SAN TELMO'],
              platos: [
                'Foie a la plancha con compota de manzana',
                'Risotto de sepia con queso Idiazábal',
                'Carrillera de ternera guisada al vino tinto',
                'Cochinillo de Leitza asado lentamente con cerveza',
              ],
              direccion: 'C/ 31 de Agosto, 28',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=La+Cuchara+de+San+Telmo+31+de+Agosto+28+San+Sebastian',
            },
            {
              id: 'casa-urola',
              nombre: 'Casa Urola',
              tipo: 'Cocina vasca refinada',
              zona: 'Parte Vieja',
              platos: [
                'Ensalada tomate bonito',
                'Vieira a la plancha sobre ajoblanco',
                'Foie a la plancha con pochas guisadas y salsa de pato',
                'Alcachofa y cardo navarro, crema de jamón y praliné salado de almendras',
              ],
              direccion: 'Fermín Calbetón, 20',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Casa+Urola+Fermin+Calbeton+20+San+Sebastian',
            },
            {
              id: 'gandarias',
              nombre: 'Gandarias',
              tipo: 'Pintxos tradicionales',
              zona: 'Parte Vieja',
              platos: [
                'Alcachofa con papada ibérica de bellota',
                'Concha de marisco gratinada',
                'Arroz con leche',
              ],
              direccion: 'C/ 31 de Agosto, 23',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Gandarias+31+de+Agosto+23+San+Sebastian',
            },
            {
              id: 'la-vina',
              nombre: 'La Viña',
              tipo: 'Postres y repostería',
              zona: 'Parte Vieja',
              platos: ['Tarta de queso vasca'],
              direccion: 'C/ 31 de Agosto, 3',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=La+Vina+31+de+Agosto+3+San+Sebastian',
            },
            {
              id: 'borda-berri',
              nombre: 'Borda Berri',
              tipo: 'Cocina vasca',
              zona: 'Parte Vieja',
              alias: ['BORDA BERI'],
              platos: [
                'Carrillera al vino tinto',
                'Risotto con queso Idiazábal (orzo)',
              ],
              direccion: 'C/ Fermín Calbetón, 12',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Borda+Berri+Fermin+Calbeton+12+San+Sebastian',
            },
          ],
        },

        {
          id: 'otros',
          titulo: 'Otros lugares que probamos',
          corto: 'Otros lugares',
          lugares: [
            {
              id: 'ganbara',
              nombre: 'Ganbara',
              tipo: 'Pintxos gourmet',
              zona: 'Parte Vieja',
              platos: [
                'Hongos a la plancha con yema de huevo y foie gras',
                'Ensalada de tomate',
              ],
              direccion: 'C/ San Jerónimo, 21',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Ganbara+San+Jeronimo+21+San+Sebastian',
            },
            {
              id: 'txepetxa',
              nombre: 'Txepetxa',
              tipo: 'Especialidad en anchoas',
              zona: 'Parte Vieja',
              platos: ['Anchoa con crema de centollo'],
              direccion: 'C/ Pescadería, 5',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Txepetxa+Pescaderia+5+San+Sebastian',
            },
            {
              id: 'bar-sport',
              nombre: 'Bar Sport',
              tipo: 'Pintxos clásicos',
              zona: 'Parte Vieja',
              alias: ['SPORT'],
              platos: [
                'Foie a la plancha con pochas guisadas y salsa de pato',
                'Crema de erizo al curry',
              ],
              direccion: 'Fermín Calbetón',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Bar+Sport+Fermin+Calbeton+San+Sebastian',
            },
            {
              id: 'tamboril',
              nombre: 'Tamboril',
              tipo: 'Pintxos de setas',
              zona: 'Parte Vieja',
              platos: ['Pintxo de champiñón'],
              direccion: 'Parte Vieja',
              cp: '20003 San Sebastián',
              maps: 'https://www.google.com/maps/search/?api=1&query=Tamboril+San+Sebastian',
            },
          ],
        },

        {
          id: 'bebidas',
          titulo: 'Bebidas',
          corto: 'Bebidas',
          bebidas: [
            {
              nombre: 'Caña',
              texto: 'Cerveza tradicional de la región. Su frescor y ligereza la hacen la compañera perfecta para recorrer los pintxos por la Parte Vieja.',
            },
            {
              nombre: 'Txacoli',
              texto: 'Vino blanco joven y ligero típico del País Vasco. Una ligera carbonatación natural le da ese carácter refrescante y frutal que define esta región vinícola.',
            },
          ],
        },
      ],
    },
  ],
};
