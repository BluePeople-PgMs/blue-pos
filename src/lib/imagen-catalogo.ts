/**
 * Miniaturas del catálogo: solo fotos de comida o bebida (Pexels, IDs revisados).
 * https://www.pexels.com
 */
const P = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop`;

/** IDs usados en el catálogo; todos son platos, ingredientes o bebidas. */
const COMIDA = {
  pastaCruda: 1279330,
  pastaCocinada: 6294352,
  pastaSalsa: 1527603,
  frituraItaliana: 5410402,
  bruschetta: 769289,
  antipasto: 1437265,
  ensalada: 1640777,
  caprese: 1049626,
  embutidos: 1639558,
  sopa: 696218,
  mariscos: 842571,
  risotto: 2474661,
  carne: 3535385,
  pescado: 266363,
  verduras: 461198,
  pizza: 1653877,
  pizzaHorno: 2147491,
  pizzaCorte: 1267327,
  postre: 2915280,
  postre2: 4531306,
  cafe: 302899,
  queso: 821637,
  aceite: 4498125,
  vino: 1283219,
  bebida: 1695239,
  conservas: 2097090,
  harina: 266363,
} as const;

const POR_CATEGORIA: Record<string, number[]> = {
  Entradas: [
    COMIDA.bruschetta,
    COMIDA.antipasto,
    COMIDA.caprese,
    COMIDA.frituraItaliana,
  ],
  Sopas: [COMIDA.sopa, COMIDA.mariscos, COMIDA.conservas],
  Ensaladas: [COMIDA.ensalada, COMIDA.caprese, COMIDA.verduras],
  Pastas: [
    COMIDA.pastaCocinada,
    COMIDA.pastaSalsa,
    COMIDA.pastaCruda,
    COMIDA.conservas,
  ],
  Risottos: [COMIDA.risotto, COMIDA.mariscos, COMIDA.verduras],
  "Platos fuertes": [COMIDA.carne, COMIDA.pescado, COMIDA.pizzaHorno],
  Guarniciones: [COMIDA.verduras, COMIDA.ensalada, COMIDA.pastaSalsa],
  Pizzas: [COMIDA.pizza, COMIDA.pizzaHorno, COMIDA.pizzaCorte],
  Postres: [COMIDA.postre, COMIDA.postre2, COMIDA.cafe],
  "Bebidas de la casa": [COMIDA.cafe, COMIDA.bebida, COMIDA.vino],
  "Pasta seca": [COMIDA.pastaCruda, COMIDA.pastaCocinada, COMIDA.conservas],
  "Salsas y conservas": [COMIDA.conservas, COMIDA.pastaSalsa, COMIDA.aceite],
  Quesos: [COMIDA.queso, COMIDA.caprese, COMIDA.antipasto],
  Embutidos: [COMIDA.embutidos, COMIDA.antipasto, COMIDA.carne],
  "Pizzas empacadas": [COMIDA.pizza, COMIDA.pizzaCorte, COMIDA.pizzaHorno],
  "Aceites y vinagres": [COMIDA.aceite, COMIDA.conservas, COMIDA.ensalada],
  "Harinas y masas": [COMIDA.pastaCruda, COMIDA.pizzaCorte, COMIDA.conservas],
  "Dulces empacados": [COMIDA.postre, COMIDA.postre2, COMIDA.conservas],
  "Bebidas empacadas": [COMIDA.vino, COMIDA.bebida, COMIDA.cafe],
  Despensa: [COMIDA.conservas, COMIDA.aceite, COMIDA.queso],
  Ingredientes: [COMIDA.ensalada, COMIDA.verduras, COMIDA.aceite],
};

/** Los patrones más específicos van primero (p. ej. arancini antes que ragù). */
const POR_NOMBRE: [RegExp, number][] = [
  [/arancini/i, COMIDA.frituraItaliana],
  [/bruschetta/i, COMIDA.bruschetta],
  [/caprese|bufala|burrata/i, COMIDA.caprese],
  [/prosciutto|melone|salumi|tagliere|salame|bresaola|pancetta|guanciale/i, COMIDA.embutidos],
  [/minestrone|fagioli|zuppa/i, COMIDA.sopa],
  [/insalata|rucola|panzanella/i, COMIDA.ensalada],
  [/carbonara|cacio e pepe|amatriciana/i, COMIDA.pastaSalsa],
  [/arrabbiata|pomodoro/i, COMIDA.pastaCocinada],
  [/ragù|ragu|bolognese|lasagna/i, COMIDA.pastaCocinada],
  [/spaghetti|linguine|penne|rigatoni|bucatini|tagliatelle|gnocchi|ravioli|paccheri/i, COMIDA.pastaCocinada],
  [/risotto/i, COMIDA.risotto],
  [/parmigiana|pollo|osso buco|saltimbocca|bistecca|fiorentina/i, COMIDA.carne],
  [/branzino|pesce/i, COMIDA.pescado],
  [/melanzane|patate|verdure|spinaci/i, COMIDA.verduras],
  [/pizza|margherita|marinara|diavola|calzone|focaccia|congelada|impasto/i, COMIDA.pizza],
  [/tiramis|panna cotta|cannoli|gelato|savoiardi|panettone|cioccolato|nocciola/i, COMIDA.postre],
  [/espresso|cappuccino|caffè|cafe/i, COMIDA.cafe],
  [/pasta seca|spaghetti n\.|penne rigate|rigatoni|linguine|lasagne all'uovo|gnocchi di patate/i, COMIDA.pastaCruda],
  [/passata|pomodori|sugo|pesto/i, COMIDA.conservas],
  [/parmigiano|grana|mozzarella|gorgonzola/i, COMIDA.queso],
  [/olio|oliva|aceto|balsamico/i, COMIDA.aceite],
  [/farina|semola|lievito/i, COMIDA.pastaCruda],
  [/acqua|aranciata|chianti|prosecco|birra/i, COMIDA.vino],
  [/pepe|origano|acciughe|olive/i, COMIDA.conservas],
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