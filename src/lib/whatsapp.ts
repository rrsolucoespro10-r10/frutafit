import type { CartItem, CustomerDetails, OrderTotals } from '../types';
import {
  PAYMENT_LABELS,
  STORE_NAME,
  WHATSAPP_NUMBER,
  deliveryPromise,
  getCity,
  getZone,
} from '../config';
import { brl, onlyDigits } from './format';
import { lineTotal } from './cart';

export function buildOrderMessage(
  cart: CartItem[],
  customer: CustomerDetails,
  totals: OrderTotals,
  orderCode: string,
): string {
  const city = getCity(customer.city);
  const zone = getZone(customer.city, customer.neighborhood);
  const lines: string[] = [];

  lines.push(`🍓 *NOVO PEDIDO — ${STORE_NAME.toUpperCase()}*`);
  lines.push(`Código: ${orderCode}`);
  lines.push('______________________________');
  lines.push('');
  lines.push(`👤 *Cliente:* ${customer.name}`);
  lines.push(`📞 *Contato:* ${customer.phone}`);

  if (customer.deliveryType === 'delivery') {
    lines.push('🛵 *Entrega em casa*');
    lines.push(`🏙️ *Cidade:* ${city.name} — ${city.state}`);
    lines.push(`🏠 ${customer.address}`);
    if (zone) lines.push(`📍 Bairro: ${zone.name}`);
    if (customer.complement.trim()) lines.push(`ℹ️ ${customer.complement}`);
    // A promessa vai junto do pedido para que a cozinha monte a rota pelo que
    // foi prometido ao cliente, e não pela ordem de chegada das mensagens.
    lines.push(`🗓️ *Entrega prevista:* ${deliveryPromise(city, customer.neighborhood)}`);
  } else {
    lines.push('🏪 *Retirada no local*');
    if (city.pickup) {
      lines.push(`📍 ${city.pickup.address}`);
      lines.push(`🕒 ${city.pickup.hours}`);
    }
  }

  lines.push('');
  lines.push('🛒 *Itens*');
  cart.forEach((item) => {
    // O formato e o total de porções vão explícitos: é o que a cozinha usa
    // para separar, e "2x Kit Green Detox" sozinho pode ser 2 ou 20 porções.
    const portions = item.variant.units * item.quantity;
    lines.push(
      `• *${item.quantity}x ${item.product.name}* (${item.variant.shortLabel}) — ${brl(lineTotal(item))}`,
    );
    lines.push(`   └ total: ${portions} ${portions === 1 ? 'porção' : 'porções'}`);
    if (item.selectedAddons.length > 0) {
      lines.push(`   └ adicionais: ${item.selectedAddons.map((a) => a.shortName).join(', ')}`);
    }
    if (item.notes?.trim()) {
      lines.push(`   └ obs: ${item.notes.trim()}`);
    }
  });

  lines.push('');
  lines.push('______________________________');
  lines.push(`💰 *Subtotal:* ${brl(totals.subtotal)}`);
  if (customer.deliveryType === 'delivery') {
    lines.push(`🛵 *Entrega:* ${totals.deliveryFee === 0 ? 'grátis 🎉' : brl(totals.deliveryFee)}`);
  }
  lines.push(`🔥 *Total: ${brl(totals.total)}*`);
  lines.push('');
  lines.push(`💳 *Pagamento:* ${PAYMENT_LABELS[customer.paymentMethod]}`);
  if (customer.paymentMethod === 'cash' && customer.changeFor.trim()) {
    lines.push(`💵 Troco para: ${customer.changeFor}`);
  }

  if (customer.notes.trim()) {
    lines.push('');
    lines.push(`📝 *Observações:* ${customer.notes.trim()}`);
  }

  lines.push('');
  lines.push(`_Enviado pelo app ${STORE_NAME}_`);

  return lines.join('\n');
}

export function generateOrderCode(): string {
  const now = new Date();
  const stamp = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FF-${stamp}-${rand}`;
}

/**
 * Grava o pedido antes de abrir o WhatsApp.
 *
 * Isso é o que separa "formulário bonito" de "operação": sem registro você não
 * tem histórico, ticket médio, produto mais vendido nem base para remarketing.
 * Substitua o corpo por um insert no Supabase quando o backend estiver de pé.
 * Falha aqui nunca deve bloquear o pedido — o cliente vem primeiro.
 *
 * O timeout já está aqui de propósito: hoje o corpo é síncrono e não trava, mas
 * no dia em que virar chamada de rede, um 4G ruim seguraria o cliente na tela
 * "Enviando…" para sempre. Depois de PERSIST_TIMEOUT_MS seguimos para o
 * WhatsApp de qualquer jeito.
 */
const PERSIST_TIMEOUT_MS = 3000;

export async function persistOrder(payload: {
  orderCode: string;
  cart: CartItem[];
  customer: CustomerDetails;
  totals: OrderTotals;
}): Promise<void> {
  const write = async () => {
    // await supabase.from('orders').insert({ ... });
    console.info('[FrutaFit] pedido registrado', payload.orderCode);
  };

  try {
    await Promise.race([
      write(),
      new Promise<void>((resolve) => setTimeout(resolve, PERSIST_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.error('[FrutaFit] falha ao registrar pedido', error);
  }
}

export function isWhatsAppConfigured(): boolean {
  return onlyDigits(WHATSAPP_NUMBER).length >= 12;
}

/**
 * Abre o WhatsApp com o pedido montado.
 *
 * Navega na mesma aba em vez de `window.open(..., '_blank')`: a chamada acontece
 * depois de um `await` (a gravação do pedido), então já saiu da pilha do clique
 * do usuário e o Safari do iPhone bloqueia a janela nova silenciosamente — o
 * cliente aperta "enviar", nada acontece e o pedido morre ali. Navegação na
 * própria aba não é bloqueada, e o app volta pelo botão "voltar" com a sacola
 * intacta no localStorage.
 */
export function openWhatsApp(message: string): void {
  const number = onlyDigits(WHATSAPP_NUMBER);
  if (!number) {
    console.error('[FrutaFit] VITE_WHATSAPP_NUMBER não configurado.');
    return;
  }
  window.location.assign(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
}
