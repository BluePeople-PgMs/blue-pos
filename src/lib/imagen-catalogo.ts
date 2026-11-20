/** Miniaturas del catálogo (Pexels, IDs verificados). */
const P = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop`;

const POR_CATEGORIA: Record<string, number[]> = {
  Entradas: [1640777, 1435907, 1095550, 723198],
  Sopas: [696218, 723198, 405395],
  Ensaladas: [1640777, 1095550, 1527603],
  Pastas: [1279330, 1284200, 1527603, 2474661, 6294352],
  Risottos: [2474661, 696218, 1284200],
  "Platos fuertes": [3535385, 4518843, 2147491, 1568605],
  Guarniciones: [1527603, 1640777, 1095550],
  Pizzas: [1653877, 2147491, 1267327, 1568605],
  Postres: [2915280, 4531306, 205961, 3024697],
  "Bebidas de la casa": [302899, 1568605, 1565382],
  "Pasta seca": [1279330, 405395, 376464, 958545],
  "Salsas y conservas": [405395, 723198, 376464],
  Quesos: [821637, 1435907, 1095550],
  Embutidos: [3535385, 1435907, 4518843],
  "Pizzas empacadas": [1653877, 2147491, 1267327],
  "Aceites y vinagres": [4498125, 723198, 405395],
  "Harinas y masas": [405395, 376464, 1279330],
  "Dulces empacados": [2915280, 205961, 4531306],
  "Bebidas empacadas": [1283219, 958545, 1565382, 302899],
  Despensa: [405395, 723198, 376464],
  Ingredientes: [1640777, 1527603, 405395],
};

const POR_NOMBRE: [RegExp, number][] = [
  [/bruschetta|pomodoro/i, 723198],
  [/caprese|bufala|burrata/i, 1435907],
  [/prosciutto|melone|salumi|tagliere/i, 3535385],
  [/arancini/i, 1284200],
  [/minestrone|fagioli|zuppa/i, 696218],
  [/insalata|rucola|panzanella/i, 1640777],
  [/carbonara|cacio e pepe|amatriciana|arrabbiata/i, 1527603],
  [/ragù|ragu|bolognese|lasagna|spaghetti|linguine|penne|rigatoni|bucatini|tagliatelle|gnocchi|ravioli|fettuccine/i, 1279330],
  [/risotto/i, 2474661],
  [/parmigiana|pollo|osso buco|saltimbocca|bistecca|fiorentina/i, 4518843],
  [/branzino|pesce/i, 696218],
  [/melanzane|patate|verdure|spinaci/i, 1527603],
  [/pizza|margherita|marinara|diavola|calzone|focaccia/i, 1653877],
  [/tiramis|panna cotta|cannoli|gelato/i, 2915280],
  [/espresso|cappuccino|caffè|cafe/i, 302899],
  [/spaghetti|penne|rigatoni|linguine|tagliatelle|lasagne|gnocchi|paccheri|pasta seca/i, 1279330],
  [/passata|pomodori|sugo|pesto/i, 405395],
  [/parmigiano|grana|mozzarella|gorgonzola|queso/i, 821637],
  [/prosciutto|salame|bresaola|pancetta|guanciale/i, 3535385],
  [/congelada|impasto|base para pizza/i, 2147491],
  [/olio|oliva/i, 4498125],
  [/aceto|balsamico/i, 4498125],
  [/farina|semola|lievito/i, 376464],
  [/savoiardi|panettone|cioccolato|nocciola/i, 2915280],
  [/acqua|aranciata|chianti|prosecco|birra/i, 1283219],
  [/pepe|origano|acciughe|olive/i, 723198],
];

function indicePorCodigo(codigo: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < codigo.length; i += 1) {
    hash = (hash * 31 + codigo.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

export function urlImagenCatalogo(input: {
  codigo: string;
  nombre: string;
  categoria: string;
}): string {
  for (const [patron, id] of POR_NOMBRE) {
    if (patron.test(input.nombre)) return P(id);
  }
  const pool = POR_CATEGORIA[input.categoria] ?? POR_CATEGORIA.Ingredientes;
  const id = pool[indicePorCodigo(input.codigo, pool.length)] ?? pool[0];
  return P(id);
}