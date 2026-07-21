import type { PaymentMethod } from './types';

/**
 * Regras da operação. Tudo que muda sem redeploy de lógica mora aqui.
 * O número do WhatsApp vem de variável de ambiente — nunca commite o real.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ AJUSTE ANTES DE VENDER                                                   │
 * │ Os bairros vieram de base pública de CEP e de índice de localidades.     │
 * │ Confirme um a um contra a SUA rota: bairro listado que você não atende   │
 * │ vira pedido cancelado, e taxa errada vira prejuízo silencioso.           │
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
  /** Previsão de entrega em minutos. */
  etaMinutes: number;
}

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
  /** Mínimo do pedido. 0 = sem mínimo (o próprio pacote já é o piso). */
  minOrder: number;
  freeShippingThreshold: number;
  zones: DeliveryZone[];
  /** Ponto de retirada nesta cidade, se houver. */
  pickup: { address: string; hours: string } | null;
}

/**
 * Bairro "não achei o meu".
 *
 * A lista abaixo veio de base pública e nunca vai cobrir todo nome que o povo
 * usa no dia a dia — condomínio novo, loteamento, apelido de rua. Sem esta
 * saída, quem não se encontra na lista fecha o app e some. Com ela, o pedido
 * entra, o endereço vem escrito e você confirma a taxa no WhatsApp.
 */
export const OTHER_ZONE_ID = 'outro';

export const CITIES: City[] = [
  {
    // SEDE. Rota própria, entrega rápida, frete barato.
    id: 'taquaritinga-do-norte',
    name: 'Taquaritinga do Norte',
    state: 'PE',
    active: true,
    minOrder: 0,
    freeShippingThreshold: 120.0,
    pickup: {
      address: 'CONFIRME: endereço da sede — Centro, Taquaritinga do Norte',
      hours: 'seg a sex 8h–18h, sáb 8h–14h',
    },
    zones: [
      { id: 'tq-centro', name: 'Centro', fee: 5.0, etaMinutes: 30 },
      { id: 'tq-vila-alta', name: 'Vila Alta', fee: 5.0, etaMinutes: 30 },
      { id: 'tq-alto-do-cruzeiro', name: 'Alto do Cruzeiro', fee: 6.0, etaMinutes: 35 },
      { id: 'tq-serra-do-vento', name: 'Serra do Vento', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-pao-de-acucar', name: 'Pão de Açúcar', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-gravata-do-ibiapina', name: 'Gravatá do Ibiapina', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-capibaribe', name: 'Capibaribe', fee: 10.0, etaMinutes: 50 },
      { id: 'tq-socorro', name: 'Socorro', fee: 10.0, etaMinutes: 50 },
      { id: 'tq-mateus-vieira', name: 'Mateus Vieira', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-silva-de-baixo', name: 'Silva de Baixo', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-acudinho', name: 'Açudinho', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-algodao', name: 'Algodão', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-jerimum', name: 'Jerimum', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-tatus', name: 'Tatus', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-pedra-preta', name: 'Sítio Pedra Preta', fee: 12.0, etaMinutes: 60 },
      { id: 'tq-placas', name: 'Comunidade de Placas', fee: 12.0, etaMinutes: 60 },
      { id: OTHER_ZONE_ID, name: 'Outro — confirmamos no WhatsApp', fee: 12.0, etaMinutes: 60 },
    ],
  },
  {
    // ~30 km da sede.
    id: 'santa-cruz-do-capibaribe',
    name: 'Santa Cruz do Capibaribe',
    state: 'PE',
    active: true,
    minOrder: 0,
    freeShippingThreshold: 160.0,
    pickup: null,
    zones: [
      { id: 'sc-centro', name: 'Centro', fee: 12.0, etaMinutes: 70 },
      { id: 'sc-bairro-novo', name: 'Bairro Novo', fee: 12.0, etaMinutes: 70 },
      { id: 'sc-bairro-da-moda', name: 'Bairro da Moda', fee: 12.0, etaMinutes: 70 },
      { id: 'sc-bela-vista', name: 'Bela Vista', fee: 12.0, etaMinutes: 70 },
      { id: 'sc-capibaribe', name: 'Capibaribe', fee: 12.0, etaMinutes: 70 },
      { id: 'sc-centenario', name: 'Cruz Alta', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-dona-dom', name: 'Dona Dom', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-gaudencio', name: 'Gaudêncio Gomes Feitosa', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-malaquias-cardoso', name: 'Malaquias Cardoso', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-malhada-do-meio', name: 'Malhada do Meio', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-manhosa', name: 'Manhosa', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-nova-santa-cruz', name: 'Nova Santa Cruz', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-oscarzao', name: 'Oscarzão', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-palestina', name: 'Palestina', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-santo-agostinho', name: 'Santo Agostinho', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-sao-cristovao', name: 'São Cristóvão', fee: 14.0, etaMinutes: 75 },
      { id: 'sc-poco-fundo', name: 'Poço Fundo (distrito)', fee: 20.0, etaMinutes: 95 },
      { id: 'sc-vila-do-para', name: 'Vila do Pará (distrito)', fee: 20.0, etaMinutes: 95 },
      { id: 'sc-area-rural', name: 'Área rural', fee: 20.0, etaMinutes: 95 },
      { id: OTHER_ZONE_ID, name: 'Outro — confirmamos no WhatsApp', fee: 16.0, etaMinutes: 80 },
    ],
  },
  {
    // ~50 km da sede. Desligada de propósito: cadeia de frio nessa distância
    // precisa ser resolvida antes de prometer entrega. Vire `active: true`
    // quando a caixa térmica e o tempo em trânsito estiverem definidos.
    id: 'caruaru',
    name: 'Caruaru',
    state: 'PE',
    active: false,
    minOrder: 120.0,
    freeShippingThreshold: 250.0,
    pickup: null,
    zones: [
      { id: 'cr-centro', name: 'Centro', fee: 20.0, etaMinutes: 110 },
      { id: 'cr-mauricio-de-nassau', name: 'Maurício de Nassau', fee: 20.0, etaMinutes: 110 },
      { id: 'cr-petropolis', name: 'Petrópolis', fee: 22.0, etaMinutes: 115 },
      { id: 'cr-universitario', name: 'Universitário', fee: 22.0, etaMinutes: 115 },
      { id: 'cr-indianopolis', name: 'Indianópolis', fee: 25.0, etaMinutes: 120 },
      { id: 'cr-boa-vista', name: 'Boa Vista', fee: 25.0, etaMinutes: 120 },
      { id: 'cr-salgado', name: 'Salgado', fee: 25.0, etaMinutes: 120 },
      { id: 'cr-alto-do-moura', name: 'Alto do Moura', fee: 30.0, etaMinutes: 130 },
      { id: OTHER_ZONE_ID, name: 'Outro — confirmamos no WhatsApp', fee: 30.0, etaMinutes: 130 },
    ],
  },
];

/** Só as cidades que o cliente pode escolher hoje. */
export const ACTIVE_CITIES = CITIES.filter((c) => c.active);

/** Cidade padrão: a sede. */
export const DEFAULT_CITY_ID = 'taquaritinga-do-norte';

/** Mínimo para retirada no local — sem custo de rota, não carrega mínimo de rota. */
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

/** Promessa de entrega, pronta para a tela e para o WhatsApp. */
export function deliveryPromise(cityId: string, zoneId: string): string {
  const zone = getZone(cityId, zoneId);
  return zone ? `cerca de ${zone.etaMinutes} min` : 'no mesmo dia';
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
