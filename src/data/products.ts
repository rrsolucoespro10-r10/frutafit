import type { Addon, Product, ProductVariant, Category } from '../types';

export const AVAILABLE_ADDONS: Addon[] = [
  { id: 'whey', name: 'Whey protein concentrado (+15g de proteína)', shortName: 'Whey', price: 4.5 },
  { id: 'honey', name: 'Mel orgânico silvestre', shortName: 'Mel', price: 2.5 },
  { id: 'chia', name: 'Sementes de chia e linhaça', shortName: 'Chia', price: 2.0 },
  { id: 'collagen', name: 'Colágeno hidrolisado', shortName: 'Colágeno', price: 3.5 },
  { id: 'peanut_butter', name: 'Pasta de amendoim integral', shortName: 'Amendoim', price: 3.0 },
];

export const CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos os kits' },
  { id: 'detox', label: '🍏 Detox' },
  { id: 'proteico', label: '💪 Proteicos' },
  { id: 'energia', label: '⚡ Energia' },
  { id: 'imunidade', label: '🛡️ Imunidade' },
  { id: 'tropical', label: '🌴 Tropical' },
];

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ PREÇOS SÃO PLACEHOLDER — TROQUE ANTES DE DIVULGAR O LINK                 │
 * │ Monte a partir do SEU custo por porção (fruta + embalagem + energia +    │
 * │ mão de obra + frete), não a partir do preço do concorrente. Se o pacote  │
 * │ não tiver margem melhor que a unidade, o modelo semanal trabalha contra  │
 * │ você: entrega o mesmo trabalho por menos dinheiro.                       │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * O pacote de 10 é o carro-chefe: uma rota entrega a semana inteira do cliente.
 * A unidade avulsa existe como porta de entrada — quem nunca provou dificilmente
 * compra dez de primeira.
 */
function variants(unitPrice: number, packPrice: number): ProductVariant[] {
  return [
    {
      id: 'unit',
      label: '1 unidade — para experimentar',
      shortLabel: '1 un',
      units: 1,
      price: unitPrice,
    },
    {
      id: 'pack10',
      label: 'Pacote semanal · 10 unidades',
      shortLabel: '10 un',
      units: 10,
      price: packPrice,
    },
  ];
}

/**
 * Catálogo estático. Quando migrar para Supabase, troque só este arquivo
 * por um fetch — nenhum componente precisa mudar.
 *
 * Foto de banco converte menos que foto real do produto. Substitua assim que puder:
 * o cliente está comprando um pacote de fruta congelada, não um copo pronto.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'kit-green-detox',
    name: 'Kit Green Detox',
    tagline: 'Desincha e dá aquela leveza no fim do dia',
    category: 'detox',
    unitWeight: '150g',
    unitYield: '400ml',
    calories: 98,
    ingredients: ['Couve', 'Abacaxi pérola', 'Gengibre', 'Hortelã', 'Maçã verde'],
    image:
      'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
    isAvailable: true,
    variants: variants(14.9, 119.0),
  },
  {
    id: 'kit-whey-red-boost',
    name: 'Kit Proteico Red Berry',
    tagline: 'Pós-treino que sustenta até a próxima refeição',
    category: 'proteico',
    unitWeight: '170g',
    unitYield: '450ml',
    calories: 142,
    ingredients: ['Morango', 'Açaí sem açúcar', 'Amora', 'Mirtilo', 'Banana'],
    image:
      'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
    isAvailable: true,
    variants: variants(18.9, 152.0),
  },
  {
    id: 'kit-tropical-energy',
    name: 'Kit Tropical Energy',
    tagline: 'Energia antes do treino, sem estufar',
    category: 'energia',
    unitWeight: '160g',
    unitYield: '400ml',
    calories: 125,
    ingredients: ['Manga rosa', 'Maracujá', 'Cenoura', 'Gengibre', 'Guaraná em pó'],
    image:
      'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    variants: variants(15.9, 127.0),
  },
  {
    id: 'kit-imuno-c',
    name: 'Kit Imuno C+',
    tagline: 'Dose cheia de vitamina C para os dias puxados',
    category: 'imunidade',
    unitWeight: '150g',
    unitYield: '400ml',
    calories: 110,
    ingredients: ['Laranja', 'Acerola', 'Maracujá', 'Cúrcuma', 'Própolis'],
    image:
      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    variants: variants(13.9, 111.0),
  },
  {
    id: 'kit-coco-creme',
    name: 'Kit Cremosão de Abacaxi',
    tagline: 'Textura de sorvete, sem açúcar adicionado',
    category: 'tropical',
    unitWeight: '160g',
    unitYield: '400ml',
    calories: 135,
    ingredients: ['Abacaxi', 'Leite de coco congelado', 'Banana', 'Hortelã'],
    image:
      'https://images.unsplash.com/photo-1502741126161-b048400d085d?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
    isAvailable: true,
    variants: variants(16.5, 132.0),
  },
  {
    id: 'kit-fit-matcha',
    name: 'Kit Slim Matcha & Kiwi',
    tagline: 'Chá verde de verdade, batido em 30 segundos',
    category: 'detox',
    unitWeight: '150g',
    unitYield: '400ml',
    calories: 88,
    ingredients: ['Kiwi', 'Maçã verde', 'Matcha orgânico', 'Limão siciliano', 'Espinafre'],
    image:
      'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    variants: variants(17.5, 140.0),
  },
];
