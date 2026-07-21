import { useCallback, useMemo } from 'react';
import type { Addon, CartItem, DeliveryType, OrderTotals, Product } from '../types';
import {
  FREE_SHIPPING_THRESHOLD,
  MAX_ITEM_QUANTITY,
  MIN_ORDER_VALUE,
  getDeliveryFee,
} from '../config';
import { buildCartItemId, lineTotal } from '../lib/cart';
import { usePersistentState } from './usePersistentState';

export function useCart() {
  const [cart, setCart] = usePersistentState<CartItem[]>('fruta_fit_cart_v2', []);

  const addItem = useCallback(
    (product: Product, quantity: number, selectedAddons: Addon[], notes?: string) => {
      const cartItemId = buildCartItemId(product.id, selectedAddons);
      setCart((prev) => {
        const index = prev.findIndex((i) => i.cartItemId === cartItemId);
        if (index === -1) {
          return [...prev, { cartItemId, product, quantity, selectedAddons, notes }];
        }
        // Cópia imutável do item: mutar o objeto (mesmo copiando o array)
        // não dispara re-render confiável e persiste estado sujo no storage.
        return prev.map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + quantity),
                notes: notes || item.notes,
              }
            : item,
        );
      });
    },
    [setCart],
  );

  /** delta é relativo: -1 remove uma unidade, +1 adiciona. */
  const changeQuantity = useCallback(
    (cartItemId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) =>
            item.cartItemId === cartItemId
              ? // O teto vale aqui também, não só no modal: sem isso o cliente
                // segura o "+" na sacola e monta um pedido que a operação não
                // consegue produzir.
                { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + delta) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    },
    [setCart],
  );

  const removeItem = useCallback(
    (cartItemId: string) => {
      setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    },
    [setCart],
  );

  const clearCart = useCallback(() => setCart([]), [setCart]);

  const getTotals = useCallback(
    (deliveryType: DeliveryType, neighborhoodId: string): OrderTotals => {
      const subtotal = cart.reduce((acc, item) => acc + lineTotal(item), 0);
      const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

      let deliveryFee = 0;
      if (deliveryType === 'delivery' && subtotal < FREE_SHIPPING_THRESHOLD) {
        deliveryFee = getDeliveryFee(neighborhoodId);
      }

      return {
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        itemCount,
        missingForFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
        missingForMinOrder: Math.max(0, MIN_ORDER_VALUE - subtotal),
        meetsMinOrder: subtotal >= MIN_ORDER_VALUE,
      };
    },
    [cart],
  );

  const itemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  return { cart, itemCount, addItem, changeQuantity, removeItem, clearCart, getTotals };
}
