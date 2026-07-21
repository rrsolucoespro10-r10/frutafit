import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem, OrderTotals } from '../types';
import { brl } from '../lib/format';
import { itemPrice, lineTotal } from '../lib/cart';
import { useModalBehavior } from '../hooks/useModalBehavior';

interface Props {
  cart: CartItem[];
  totals: OrderTotals;
  isDelivery: boolean;
  onClose: () => void;
  onChangeQuantity: (cartItemId: string, delta: number) => void;
  onRemove: (cartItemId: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  cart,
  totals,
  isDelivery,
  onClose,
  onChangeQuantity,
  onRemove,
  onCheckout,
}: Props) {
  useModalBehavior(onClose);

  // Progresso direto sobre a meta: a versão anterior derivava o denominador de
  // subtotal + missingForFreeShipping, que só por coincidência dá a meta e vira
  // 100% assim que o frete fica grátis.
  const freeShippingProgress = Math.min(
    100,
    (totals.subtotal / totals.freeShippingThreshold) * 100,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sua sacola"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Sua sacola</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sacola"
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">Nada na sacola ainda</p>
              <p className="text-sm text-slate-400 mt-1">
                Escolha um kit no cardápio para começar.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Ver o cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Barra de frete grátis: alavanca de ticket médio que já estava
                  paga no código original e nunca era exibida ao cliente. */}
              {isDelivery && totals.missingForFreeShipping > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-900">
                    Faltam {brl(totals.missingForFreeShipping)} para a entrega sair de graça 🛵
                  </p>
                  <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {isDelivery && totals.missingForFreeShipping === 0 && (
                <div className="bg-emerald-600 text-white rounded-xl p-3 text-xs font-bold">
                  Entrega grátis liberada 🎉
                </div>
              )}

              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    loading="lazy"
                    className="w-16 h-16 object-cover rounded-lg shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm leading-tight">
                          {item.product.name}
                        </h4>
                        {/* O formato precisa estar visível: sem isso, "2x Kit
                            Green Detox" pode ser 2 porções ou 20. */}
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.variant.shortLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.cartItemId)}
                        aria-label={`Remover ${item.product.name}`}
                        className="text-slate-400 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Adicionais visíveis: no arquivo antigo eles entravam no
                        preço e na mensagem, mas sumiam da tela. */}
                    {item.selectedAddons.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.selectedAddons.map((addon) => (
                          <li key={addon.id} className="text-[11px] text-slate-500">
                            + {addon.shortName}{' '}
                            {/* Preço já multiplicado pelo tamanho do pacote,
                                igual ao que o modal cobrou. Mostrar o valor
                                por porção aqui faria a soma da sacola parecer
                                errada para o cliente. */}
                            <span className="text-slate-400">
                              ({brl(addon.price * item.variant.units)}
                              {item.variant.units > 1 && ` · ${brl(addon.price)} × ${item.variant.units}`})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.notes?.trim() && (
                      <p className="text-[11px] text-slate-500 italic mt-1">"{item.notes}"</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(item.cartItemId, -1)}
                          aria-label="Diminuir quantidade"
                          className="p-1.5 text-slate-600 hover:text-red-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(item.cartItemId, 1)}
                          aria-label="Aumentar quantidade"
                          className="p-1.5 text-slate-600 hover:text-emerald-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">
                          {brl(itemPrice(item))} cada
                        </p>
                        <p className="text-sm font-bold text-emerald-700">{brl(lineTotal(item))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="p-4 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-800">{brl(totals.subtotal)}</span>
            </div>

            {/* Frete explícito: o cliente precisa ver na tela o mesmo número
                que vai chegar no WhatsApp, ou o pedido cancela. */}
            {isDelivery && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Entrega</span>
                <span
                  className={
                    totals.deliveryFee === 0 ? 'font-bold text-emerald-600' : 'font-semibold text-slate-800'
                  }
                >
                  {totals.deliveryFee === 0 ? 'grátis' : brl(totals.deliveryFee)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-900">Total</span>
              <span className="text-emerald-600">{brl(totals.total)}</span>
            </div>

            {!totals.meetsMinOrder && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Pedido mínimo de {brl(totals.minOrderValue)}. Faltam{' '}
                <strong>{brl(totals.missingForMinOrder)}</strong>.
              </p>
            )}

            <button
              type="button"
              onClick={onCheckout}
              disabled={!totals.meetsMinOrder}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Avançar para o checkout
              <ArrowRight className="w-5 h-5" />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
