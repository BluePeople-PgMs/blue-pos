export type TipoCatalogo = "preparado" | "directo";

export type UnidadSemilla = {
  clave: string;
  nombre: string;
  abreviatura: string;
};

export type CategoriaSemilla = {
  nombre: string;
  orden: number;
};

export type ProductoSemilla = {
  codigo: string;
  nombre: string;
  precio: number;
  categoria: string;
  unidad: string;
  tipo: TipoCatalogo;
};

export const unidades: UnidadSemilla[] = [
  { clave: "porcion", nombre: "Porción", abreviatura: "por." },
  { clave: "pieza", nombre: "Pieza", abreviatura: "pza" },
  { clave: "botella", nombre: "Botella", abreviatura: "bot" },
  { clave: "lata", nombre: "Lata", abreviatura: "lata" },
];

export const categorias: CategoriaSemilla[] = [
  { nombre: "Entradas", orden: 10 },
  { nombre: "Sopas", orden: 20 },
  { nombre: "Ensaladas", orden: 30 },
  { nombre: "Pastas", orden: 40 },
  { nombre: "Risottos", orden: 50 },
  { nombre: "Platos fuertes", orden: 60 },
  { nombre: "Guarniciones", orden: 70 },
  { nombre: "Pizzas", orden: 80 },
  { nombre: "Postres", orden: 90 },
  { nombre: "Bebidas de la casa", orden: 100 },
  { nombre: "Pasta seca", orden: 110 },
  { nombre: "Salsas y conservas", orden: 120 },
  { nombre: "Quesos", orden: 130 },
  { nombre: "Embutidos", orden: 140 },
  { nombre: "Pizzas empacadas", orden: 150 },
  { nombre: "Aceites y vinagres", orden: 160 },
  { nombre: "Harinas y masas", orden: 170 },
  { nombre: "Dulces empacados", orden: 180 },
  { nombre: "Bebidas empacadas", orden: 190 },
  { nombre: "Despensa", orden: 200 },
];

type Item = [codigo: string, nombre: string, precio: number, unidad?: string];

function filas(
  tipo: TipoCatalogo,
  categoria: string,
  unidad: string,
  items: Item[],
): ProductoSemilla[] {
  return items.map(([codigo, nombre, precio, unidadItem]) => ({
    codigo,
    nombre,
    precio,
    categoria,
    unidad: unidadItem ?? unidad,
    tipo,
  }));
}

export const productos: ProductoSemilla[] = [
  ...filas("preparado", "Entradas", "porcion", [
    ["COM-001", "Bruschetta al pomodoro", 95],
    ["COM-002", "Bruschetta ai funghi", 110],
    ["COM-003", "Caprese classica", 145],
    ["COM-004", "Caprese di bufala", 185],
    ["COM-005", "Prosciutto e melone", 175],
    ["COM-008", "Arancini al ragù", 120],
    ["COM-012", "Tagliere di salumi", 240],
    ["COM-014", "Burrata con datterini", 190],
  ]),
  ...filas("preparado", "Sopas", "porcion", [
    ["COM-019", "Minestrone della casa", 120],
    ["COM-020", "Pasta e fagioli", 125],
    ["COM-021", "Zuppa di pesce", 195],
  ]),
  ...filas("preparado", "Ensaladas", "porcion", [
    ["COM-025", "Insalata mista", 95],
    ["COM-027", "Insalata di rucola e grana", 115],
    ["COM-028", "Panzanella", 120],
  ]),
  ...filas("preparado", "Pastas", "porcion", [
    ["COM-031", "Spaghetti al pomodoro", 145],
    ["COM-034", "Spaghetti alla carbonara", 185],
    ["COM-035", "Spaghetti cacio e pepe", 175],
    ["COM-037", "Bucatini all'amatriciana", 185],
    ["COM-039", "Tagliatelle al ragù alla bolognese", 195],
    ["COM-040", "Lasagna alla bolognese", 210],
    ["COM-042", "Penne all'arrabbiata", 155],
    ["COM-045", "Gnocchi al pesto", 180],
    ["COM-047", "Ravioli di ricotta e spinaci", 195],
    ["COM-051", "Linguine al pesto", 175],
  ]),
  ...filas("preparado", "Risottos", "porcion", [
    ["COM-055", "Risotto ai funghi porcini", 210],
    ["COM-056", "Risotto alla milanese", 205],
    ["COM-057", "Risotto ai frutti di mare", 235],
  ]),
  ...filas("preparado", "Platos fuertes", "porcion", [
    ["COM-060", "Pollo alla parmigiana", 210],
    ["COM-063", "Osso buco alla milanese", 285],
    ["COM-064", "Saltimbocca alla romana", 245],
    ["COM-065", "Bistecca alla fiorentina", 520],
    ["COM-067", "Branzino al forno", 290],
    ["COM-070", "Melanzane alla parmigiana", 175],
  ]),
  ...filas("preparado", "Guarniciones", "porcion", [
    ["COM-073", "Patate al forno", 75],
    ["COM-074", "Verdure grigliate", 85],
    ["COM-075", "Spinaci saltati all'aglio", 80],
  ]),
  ...filas("preparado", "Pizzas", "porcion", [
    ["COM-078", "Pizza Margherita", 165],
    ["COM-079", "Pizza Marinara", 145],
    ["COM-080", "Pizza Diavola", 195],
    ["COM-081", "Pizza quattro formaggi", 205],
    ["COM-082", "Pizza Capricciosa", 210],
    ["COM-087", "Pizza Bufalina", 220],
    ["COM-091", "Calzone classico", 190],
    ["COM-093", "Focaccia barese", 130],
  ]),
  ...filas("preparado", "Postres", "porcion", [
    ["COM-095", "Tiramisù", 110],
    ["COM-096", "Panna cotta ai frutti di bosco", 95],
    ["COM-097", "Cannoli siciliani", 105],
    ["COM-099", "Gelato artigianale", 85],
  ]),
  ...filas("preparado", "Bebidas de la casa", "porcion", [
    ["COM-105", "Espresso", 45],
    ["COM-107", "Cappuccino", 65],
  ]),
  ...filas("directo", "Pasta seca", "pieza", [
    ["FIN-001", "Spaghetti n.5 500 g", 68],
    ["FIN-003", "Penne rigate 500 g", 65],
    ["FIN-004", "Rigatoni 500 g", 65],
    ["FIN-007", "Linguine 500 g", 70],
    ["FIN-009", "Tagliatelle all'uovo 250 g", 78],
    ["FIN-011", "Lasagne all'uovo 500 g", 88],
    ["FIN-013", "Gnocchi di patate 500 g", 70],
    ["FIN-017", "Paccheri 500 g", 78],
  ]),
  ...filas("directo", "Salsas y conservas", "pieza", [
    ["FIN-019", "Passata di pomodoro 700 g", 48],
    ["FIN-020", "Pomodori pelati 400 g", 38, "lata"],
    ["FIN-022", "Ragù alla bolognese 400 g", 85],
    ["FIN-023", "Sugo all'arrabbiata 400 g", 78],
    ["FIN-024", "Pesto alla genovese 190 g", 115],
    ["FIN-027", "Sugo alle vongole 130 g", 125],
  ]),
  ...filas("directo", "Quesos", "pieza", [
    ["FIN-030", "Parmigiano Reggiano 24 mesi 200 g", 185],
    ["FIN-032", "Grana Padano 200 g", 145],
    ["FIN-034", "Mozzarella fior di latte 125 g", 55],
    ["FIN-035", "Mozzarella di bufala 125 g", 95],
    ["FIN-036", "Burrata 125 g", 110],
    ["FIN-039", "Gorgonzola dolce 200 g", 120],
  ]),
  ...filas("directo", "Embutidos", "pieza", [
    ["FIN-042", "Prosciutto crudo 100 g", 145],
    ["FIN-044", "Salame Milano 100 g", 95],
    ["FIN-046", "Bresaola 80 g", 135],
    ["FIN-047", "Pancetta affumicata 150 g", 110],
    ["FIN-048", "Guanciale 150 g", 155],
  ]),
  ...filas("directo", "Pizzas empacadas", "pieza", [
    ["FIN-050", "Pizza Margherita congelada", 95],
    ["FIN-051", "Pizza Diavola congelada", 110],
    ["FIN-052", "Pizza quattro formaggi congelada", 115],
    ["FIN-055", "Base para pizza, 2 piezas", 55],
    ["FIN-056", "Impasto per pizza 500 g", 48],
  ]),
  ...filas("directo", "Aceites y vinagres", "botella", [
    ["FIN-058", "Olio extravergine di oliva 500 ml", 165],
    ["FIN-059", "Olio extravergine di oliva 1 L", 285],
    ["FIN-061", "Aceto balsamico di Modena 250 ml", 95],
    ["FIN-063", "Aceto di vino bianco 500 ml", 48],
  ]),
  ...filas("directo", "Harinas y masas", "pieza", [
    ["FIN-064", "Farina 00 1 kg", 55],
    ["FIN-065", "Semola rimacinata di grano duro 1 kg", 48],
    ["FIN-067", "Lievito di birra secco 50 g", 35],
  ]),
  ...filas("directo", "Dulces empacados", "pieza", [
    ["FIN-069", "Savoiardi 400 g", 72],
    ["FIN-071", "Panettone classico 750 g", 245],
    ["FIN-074", "Cioccolato fondente 70% 100 g", 65],
    ["FIN-075", "Crema di nocciole 350 g", 95],
  ]),
  ...filas("directo", "Bebidas empacadas", "botella", [
    ["FIN-078", "Acqua naturale 1 L", 28],
    ["FIN-080", "Aranciata 330 ml", 35],
    ["FIN-083", "Chianti Classico 750 ml", 320],
    ["FIN-085", "Prosecco 750 ml", 310],
    ["FIN-086", "Birra chiara italiana 330 ml", 45],
  ]),
  ...filas("directo", "Despensa", "pieza", [
    ["FIN-089", "Pepe nero in grani 50 g", 55],
    ["FIN-090", "Origano secco 30 g", 35],
    ["FIN-095", "Acciughe in olio d'oliva 90 g", 95, "lata"],
    ["FIN-101", "Olive taggiasche 180 g", 85],
  ]),
];
