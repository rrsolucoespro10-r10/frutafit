import type { PaymentMethod } from './types';

/**
 * Regras da operação. Tudo que muda sem redeploy de lógica mora aqui.
 * O número do WhatsApp vem de variável de ambiente — nunca commite o real.
 */

export const WHATSAPP_NUMBER: string = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

export const STORE_NAME = 'FrutaFit';

/** Pedido mínimo protege a margem: kit de R$13,90 com frete de R$6 dá prejuízo. */
export const MIN_ORDER_VALUE = 35.0;

/** Teto por linha do carrinho. Acima disso é engano ou atacado — trate no 1:1. */
export const MAX_ITEM_QUANTITY = 20;

export const FREE_SHIPPING_THRESHOLD = 60.0;

/** Frete por bairro. Ajuste conforme sua rota real de entrega. */
export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  etaMinutes: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'centro', name: 'Centro', fee: 5.0, etaMinutes: 40 },
  { id: 'jardim', name: 'Jardim Paulista', fee: 6.0, etaMinutes: 50 },
  { id: 'vila-nova', name: 'Vila Nova', fee: 7.0, etaMinutes: 55 },
  { id: 'alto-do-moura', name: 'Alto do Moura', fee: 9.0, etaMinutes: 70 },
];

export const DEFAULT_DELIVERY_FEE = 6.0;

export function getDeliveryFee(neighborhoodId: string): number {
  return DELIVERY_ZONES.find((z) => z.id === neighborhoodId)?.fee ?? DEFAULT_DELIVERY_FEE;
}

export const PICKUP_ADDRESS = 'Rua Exemplo, 123 — Centro';

/** Horário de funcionamento por dia da semana (0 = domingo). */
export const OPENING_HOURS: Record<number, { open: number; close: number } | null> = {
  0: null,
  1: { open: 8, close: 18 },
  2: { open: 8, close: 18 },
  3: { open: 8, close: 18 },
  4: { open: 8, close: 18 },
  5: { open: 8, close: 19 },
  6: { open: 8, close: 14 },
};

export function isStoreOpen(now: Date = new Date()): boolean {
  const today = OPENING_HOURS[now.getDay()];
  if (!today) return false;
  const hour = now.getHours() + now.getMinutes() / 60;
  return hour >= today.open && hour < today.close;
}

/**
 * Tipado por PaymentMethod (e não Record<string, string>): assim adicionar um
 * meio de pagamento no type quebra o build aqui, em vez de renderizar um
 * `undefined` na mensagem do WhatsApp.
 */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix — enviamos a chave na confirmação',
  card_delivery: 'Cartão na entrega',
  cash: 'Dinheiro',
};
