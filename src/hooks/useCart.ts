import { useCallback, useMemo } from 'react';
import type { Addon, CartItem, DeliveryType, OrderTotals, Product } from '../types';
import { MAX_ITEM_QUANTITY, PICKUP_MIN_ORDER, getCity, getDeliveryFee } from '../config';
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
    (deliveryType: DeliveryType, cityId: string, neighborhoodId: string): OrderTotals => {
      const subtotal = cart.reduce((acc, item) => acc + lineTotal(item), 0);
      const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

      const city = getCity(cityId);
      const isDelivery = deliveryType === 'delivery';

      // Retirada não tem custo de rota, então não carrega o mínimo da rota.
      const minOrderValue = isDelivery ? city.minOrder : PICKUP_MIN_ORDER;
      const freeShippingThreshold = city.freeShippingThreshold;

      let deliveryFee = 0;
      if (isDelivery && subtotal < freeShippingThreshold) {
        deliveryFee = getDeliveryFee(cityId, neighborhoodId);
      }

      return {
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        itemCount,
        missingForFreeShipping: isDelivery ? Math.max(0, freeShippingThreshold - subtotal) : 0,
        missingForMinOrder: Math.max(0, minOrderValue - subtotal),
        meetsMinOrder: subtotal >= minOrderValue,
        minOrderValue,
        freeShippingThreshold,
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
