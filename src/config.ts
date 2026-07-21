import type { PaymentMethod } from './types';

/**
 * Regras da operação. Tudo que muda sem redeploy de lógica mora aqui.
 * O número do WhatsApp vem de variável de ambiente — nunca commite o real.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ AJUSTE ANTES DE VENDER                                                   │
 * │ Os bairros abaixo foram semeados para a região, mas você precisa         │
 * │ confirmar um a um: nome, taxa e se a rota realmente atende. Bairro       │
 * │ listado que você não entrega vira pedido cancelado e cliente queimado.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

export const WHATSAPP_NUMBER: string = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

export const STORE_NAME = 'FrutaFit';

/** Teto por linha do carrinho. Acima disso é engano ou atacado — trate no 1:1. */
export const MAX_ITEM_QUANTITY = 20;

// ---------------------------------------------------------------------------
// Cidades atendidas
// ---------------------------------------------------------------------------

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  /** Só faz sentido em cidade com rota diária. Em cidade agendada, ignorado. */
  etaMinutes?: number;
}

/**
 * `same_day`  — rota própria rodando todo dia útil. Promete minutos.
 * `scheduled` — a van sai em dias fixos. Promete data, nunca minutos.
 *
 * A diferença não é cosmética: produto congelado viajando 75 km sem promessa de
 * dia certo é reclamação garantida. Prometa o que a operação entrega.
 */
export type DeliveryMode = 'same_day' | 'scheduled';

export interface City {
  id: string;
  name: string;
  state: string;
  /**
   * Cidade fora do ar continua aqui, só não aparece para o cliente. Apagar o
   * registro quebraria pedidos antigos que apontam para ela; basta virar para
   * `true` no dia em que a rota existir.
   */
  active: boolean;
  mode: DeliveryMode;
  /** Dias em que a van roda (0 = domingo). Só para `scheduled`. */
  deliveryDays?: number[];
  /** Pedido feito depois desta hora no dia da rota entra na rota seguinte. */
  cutoffHour?: number;
  /**
   * Mínimo por cidade. Rodar 75 km para entregar um kit de R$ 15 é prejuízo:
   * cidade distante precisa de mínimo maior, não do mesmo mínimo da sede.
   */
  minOrder: number;
  freeShippingThreshold: number;
  zones: DeliveryZone[];
  /** Ponto de retirada nesta cidade, se houver. */
  pickup: { address: string; hours: string } | null;
}

export const CITIES: City[] = [
  {
    // SEDE. Rota própria, entrega no mesmo dia, frete barato.
    id: 'taquaritinga-do-norte',
    name: 'Taquaritinga do Norte',
    state: 'PE',
    active: true,
    mode: 'same_day',
    minOrder: 30.0,
    freeShippingThreshold: 100.0,
    pickup: {
      address: 'CONFIRME: endereço da sede — Centro, Taquaritinga do Norte',
      hours: 'seg a sex 8h–18h, sáb 8h–14h',
    },
    zones: [
      { id: 'tq-centro', name: 'Centro', fee: 4.0, etaMinutes: 30 },
      { id: 'tq-alto-do-cruzeiro', name: 'Alto do Cruzeiro', fee: 5.0, etaMinutes: 35 },
      { id: 'tq-bela-vista', name: 'Bela Vista', fee: 5.0, etaMinutes: 35 },
      { id: 'tq-cachoeira', name: 'Cachoeira', fee: 6.0, etaMinutes: 40 },
      { id: 'tq-serra-do-vento', name: 'Serra do Vento', fee: 10.0, etaMinutes: 60 },
      { id: 'tq-zona-rural', name: 'Zona rural / sítios', fee: 12.0, etaMinutes: 70 },
    ],
  },
  {
    // ~30 km da sede. Rota em dias fixos até o volume justificar rota diária.
    id: 'santa-cruz-do-capibaribe',
    name: 'Santa Cruz do Capibaribe',
    state: 'PE',
    active: true,
    mode: 'scheduled',
    deliveryDays: [2, 5], // terça e sexta
    cutoffHour: 12,
    minOrder: 60.0,
    freeShippingThreshold: 130.0,
    pickup: null,
    zones: [
      { id: 'sc-centro', name: 'Centro', fee: 10.0 },
      { id: 'sc-nsg', name: 'Nossa Senhora das Graças', fee: 10.0 },
      { id: 'sc-sao-jose', name: 'São José', fee: 10.0 },
      { id: 'sc-xique-xique', name: 'Xique-Xique', fee: 12.0 },
      { id: 'sc-alto-conceicao', name: 'Alto da Conceição', fee: 12.0 },
      { id: 'sc-joao-paulo-ii', name: 'João Paulo II', fee: 12.0 },
      { id: 'sc-santa-terezinha', name: 'Santa Terezinha', fee: 12.0 },
      { id: 'sc-bela-vista', name: 'Bela Vista', fee: 14.0 },
      { id: 'sc-para', name: 'Distrito do Pará', fee: 18.0 },
    ],
  },
  {
    // ~50 km da sede. Desligada de propósito: cadeia de frio nessa distância
    // precisa ser resolvida antes de prometer entrega. Vire `active: true`
    // quando a caixa térmica e a rota estiverem definidas.
    id: 'caruaru',
    name: 'Caruaru',
    state: 'PE',
    active: false,
    mode: 'scheduled',
    deliveryDays: [3], // quarta
    cutoffHour: 12,
    minOrder: 120.0,
    freeShippingThreshold: 250.0,
    pickup: null,
    zones: [
      { id: 'cr-centro', name: 'Centro', fee: 20.0 },
      { id: 'cr-mauricio-de-nassau', name: 'Maurício de Nassau', fee: 20.0 },
      { id: 'cr-petropolis', name: 'Petrópolis', fee: 22.0 },
      { id: 'cr-universitario', name: 'Universitário', fee: 22.0 },
      { id: 'cr-indianopolis', name: 'Indianópolis', fee: 25.0 },
      { id: 'cr-boa-vista', name: 'Boa Vista', fee: 25.0 },
      { id: 'cr-salgado', name: 'Salgado', fee: 25.0 },
      { id: 'cr-alto-do-moura', name: 'Alto do Moura', fee: 30.0 },
    ],
  },
];

/** Só as cidades que o cliente pode escolher hoje. */
export const ACTIVE_CITIES = CITIES.filter((c) => c.active);

/** Cidade padrão: a sede. */
export const DEFAULT_CITY_ID = 'taquaritinga-do-norte';

/** Mínimo para retirada no local — sem custo de rota, não precisa do mínimo cheio. */
export const PICKUP_MIN_ORDER = 0;

export function getCity(cityId: string): City {
  return CITIES.find((c) => c.id === cityId) ?? CITIES[0];
}

export function getZone(cityId: string, zoneId: string): DeliveryZone | undefined {
  return getCity(cityId).zones.find((z) => z.id === zoneId);
}

/**
 * Taxa usada enquanto o cliente ainda não escolheu bairro.
 *
 * É a MAIOR taxa da cidade, de propósito: se o número da tela tem que mudar
 * quando ele escolher, que mude para baixo. Estimativa que sobe no fim do
 * checkout é o jeito mais rápido de perder o pedido.
 */
export function getDeliveryFee(cityId: string, zoneId: string): number {
  const zone = getZone(cityId, zoneId);
  if (zone) return zone.fee;
  return Math.max(...getCity(cityId).zones.map((z) => z.fee));
}

export const WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

/**
 * Próxima data de entrega numa cidade agendada.
 *
 * Depois do horário de corte no próprio dia da rota, o pedido cai para a rota
 * seguinte — a van já saiu. Devolve `null` para cidade com rota diária.
 */
export function nextDeliveryDate(city: City, now: Date = new Date()): Date | null {
  if (city.mode !== 'scheduled' || !city.deliveryDays?.length) return null;

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    if (!city.deliveryDays.includes(candidate.getDay())) continue;
    if (offset === 0 && city.cutoffHour !== undefined && now.getHours() >= city.cutoffHour) {
      continue;
    }
    return candidate;
  }
  return null;
}

/** "quinta-feira, 24/07" */
export function formatDeliveryDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAY_NAMES[date.getDay()]}, ${dd}/${mm}`;
}

/** Resumo da promessa de entrega, pronto para a tela e para o WhatsApp. */
export function deliveryPromise(city: City, zoneId: string, now: Date = new Date()): string {
  if (city.mode === 'same_day') {
    const zone = getZone(city.id, zoneId);
    return zone?.etaMinutes ? `hoje, em cerca de ${zone.etaMinutes} min` : 'no mesmo dia';
  }
  const date = nextDeliveryDate(city, now);
  return date ? `${formatDeliveryDate(date)}` : 'a combinar no WhatsApp';
}

// ---------------------------------------------------------------------------
// Horário de funcionamento (recebimento de pedidos)
// ---------------------------------------------------------------------------

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
