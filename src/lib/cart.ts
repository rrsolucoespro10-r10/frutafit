import type { Addon, CartItem } from '../types';

/**
 * Aritmética do carrinho — funções puras, sem React.
 *
 * Moram em lib/ e não no hook porque lib/whatsapp.ts precisa delas para montar
 * a mensagem: se ficassem em hooks/useCart, um módulo de formatação de texto
 * passaria a importar React. Mesmo cálculo em um lugar só é o que garante que o
 * total da tela e o total do WhatsApp nunca divirjam.
 */

/** Mesmo produto com os mesmos adicionais é a mesma linha do carrinho. */
export function buildCartItemId(productId: string, addons: Addon[]): string {
  const suffix = addons
    .map((a) => a.id)
    .sort()
    .join('_');
  return suffix ? `${productId}--${suffix}` : productId;
}

export function unitPrice(item: Pick<CartItem, 'product' | 'selectedAddons'>): number {
  return item.product.price + item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
}

export function lineTotal(item: CartItem): number {
  return unitPrice(item) * item.quantity;
}
