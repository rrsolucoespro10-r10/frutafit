import type { Addon, CartItem, Product, ProductVariant } from '../types';

/**
 * Aritmética do carrinho — funções puras, sem React.
 *
 * Moram em lib/ e não no hook porque lib/whatsapp.ts precisa delas para montar
 * a mensagem: se ficassem em hooks/useCart, um módulo de formatação de texto
 * passaria a importar React. Mesmo cálculo em um lugar só é o que garante que o
 * total da tela e o total do WhatsApp nunca divirjam.
 */

/** Mesmo produto, mesmo formato e mesmos adicionais é a mesma linha. */
export function buildCartItemId(
  productId: string,
  variantId: string,
  addons: Addon[],
): string {
  const suffix = addons
    .map((a) => a.id)
    .sort()
    .join('_');
  const base = `${productId}--${variantId}`;
  return suffix ? `${base}--${suffix}` : base;
}

/**
 * Preço de uma unidade da linha — ou seja, de um pacote inteiro quando o
 * formato é o pacote.
 *
 * Adicional é cobrado por porção e multiplicado pelo tamanho do pacote: colocar
 * whey num pacote de 10 é colocar whey em dez porções, e o custo é dez vezes.
 * Cobrar uma vez só seria vender o adicional com 90% de desconto sem perceber.
 */
export function itemPrice(item: Pick<CartItem, 'variant' | 'selectedAddons'>): number {
  const addonsPerUnit = item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
  return item.variant.price + addonsPerUnit * item.variant.units;
}

export function lineTotal(item: CartItem): number {
  return itemPrice(item) * item.quantity;
}

/** Preço por porção — é o número que mostra que o pacote compensa. */
export function pricePerUnit(variant: ProductVariant): number {
  return variant.price / variant.units;
}

export function cheapestVariant(product: Product): ProductVariant {
  return product.variants.reduce((a, b) => (a.price <= b.price ? a : b));
}

/** Quanto por cento o pacote economiza contra comprar avulso. 0 se não houver. */
export function packSavingsPercent(product: Product): number {
  const unit = product.variants.find((v) => v.units === 1);
  const pack = product.variants.find((v) => v.units > 1);
  if (!unit || !pack) return 0;
  const saving = 1 - pricePerUnit(pack) / pricePerUnit(unit);
  return Math.round(saving * 100);
}
