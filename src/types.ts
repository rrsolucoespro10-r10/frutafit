export type Category = 'detox' | 'proteico' | 'energia' | 'imunidade' | 'tropical';
export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'card_delivery' | 'cash';

export interface Addon {
  id: string;
  name: string;
  shortName: string;
  price: number;
}

export type VariantId = 'unit' | 'pack10';

/**
 * Formato de venda. O pacote é o produto principal do negócio: o cliente
 * abastece a semana de uma vez e a rota entrega uma vez só. A unidade avulsa
 * existe para quem quer experimentar antes de comprar dez.
 */
export interface ProductVariant {
  id: VariantId;
  /** "Pacote semanal · 10 unidades" */
  label: string;
  /** "10 un" — para caber na sacola e na mensagem */
  shortLabel: string;
  /** Quantas porções vêm dentro. Multiplica o preço dos adicionais. */
  units: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: Category;
  /** Peso e rendimento de UMA porção, não do pacote. */
  unitWeight: string;
  unitYield: string;
  calories: number;
  ingredients: string[];
  image: string;
  isPopular?: boolean;
  isAvailable?: boolean;
  variants: ProductVariant[];
}

export interface CartItem {
  /** id derivado de produto + formato + adicionais escolhidos */
  cartItemId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  selectedAddons: Addon[];
  notes?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
  /** id da cidade em CITIES. A rota, o mínimo e o frete dependem dela. */
  city: string;
  address: string;
  neighborhood: string;
  complement: string;
  paymentMethod: PaymentMethod;
  changeFor: string;
  notes: string;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  missingForFreeShipping: number;
  missingForMinOrder: number;
  meetsMinOrder: boolean;
  /**
   * Mínimo e meta de frete grátis vigentes para esta cidade e este tipo de
   * entrega. Ficam nos totais para que os componentes não precisem reabrir o
   * config e recalcular a regra por conta própria — foi assim que tela e
   * mensagem já divergiram uma vez.
   */
  minOrderValue: number;
  freeShippingThreshold: number;
}

export type FormErrors = Partial<Record<keyof CustomerDetails, string>>;
