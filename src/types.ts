export type Category = 'detox' | 'proteico' | 'energia' | 'imunidade' | 'tropical';
export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'card_delivery' | 'cash';

export interface Addon {
  id: string;
  name: string;
  shortName: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: Category;
  price: number;
  weight: string;
  yieldVolume: string;
  calories: number;
  ingredients: string[];
  image: string;
  isPopular?: boolean;
  isAvailable?: boolean;
}

export interface CartItem {
  /** id derivado de produto + adicionais escolhidos */
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedAddons: Addon[];
  notes?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
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
}

export type FormErrors = Partial<Record<keyof CustomerDetails, string>>;
