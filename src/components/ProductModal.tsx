import { useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import type { Addon, Product, ProductVariant } from '../types';
import { AVAILABLE_ADDONS } from '../data/products';
import { MAX_ITEM_QUANTITY } from '../config';
import { brl } from '../lib/format';
import { cheapestVariant, pricePerUnit } from '../lib/cart';
import { useModalBehavior } from '../hooks/useModalBehavior';

interface Props {
  product: Product;
  onClose: () => void;
  onConfirm: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
    addons: Addon[],
    notes: string,
  ) => void;
}

/**
 * Esta tela não existia no arquivo original: activeProductModal era setado
 * mas nunca renderizado, então nenhum item entrava no carrinho.
 * É também onde os adicionais viram receita — não esconda esse passo.
 */
export function ProductModal({ product, onClose, onConfirm }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [notes, setNotes] = useState('');
  // Abre na unidade avulsa: é a porta de entrada. Empurrar o pacote de cara
  // assusta quem nunca provou, e o desconto na tela já faz o trabalho de subir.
  const [variant, setVariant] = useState<ProductVariant>(() => cheapestVariant(product));

  useModalBehavior(onClose);

  const toggleAddon = (addon: Addon) =>
    setAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon],
    );

  // Adicional é por porção: num pacote de 10 ele entra dez vezes, porque
  // fisicamente vai em dez porções.
  const addonsPerUnit = addons.reduce((sum, a) => sum + a.price, 0);
  const total = (variant.price + addonsPerUnit * variant.units) * quantity;
  const baseUnitPrice = pricePerUnit(cheapestVariant(product));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagem e cabeçalho */}
        <div className="relative shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-44 object-cover rounded-t-3xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-1.5 text-slate-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{product.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{product.tagline}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-2">
              <span>{product.unitWeight} por porção</span>
              <span aria-hidden>•</span>
              <span>rende {product.unitYield}</span>
              <span aria-hidden>•</span>
              <span>{product.calories} kcal</span>
            </div>

            {/* Com o seletor de formato escondido, é aqui que o cliente entende
                o que está levando: são 10 porções, e o preço por porção é o
                número que sustenta o valor do pacote. */}
            <div className="mt-3 flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-900 leading-tight">{variant.label}</p>
                <p className="text-[11px] text-emerald-800/80">
                  {brl(pricePerUnit(variant))} por porção · rende {variant.units} vitaminas
                </p>
              </div>
              <span className="text-lg font-extrabold text-emerald-700 shrink-0">
                {brl(variant.price)}
              </span>
            </div>
          </div>

          {/* Seletor de formato só aparece quando há mais de um. Com uma opção
              só, um "escolha" de item único é ruído puro na tela. */}
          <div className={product.variants.length > 1 ? '' : 'hidden'}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Como você quer levar
            </h3>
            <div className="space-y-2">
              {product.variants.map((v) => {
                const selected = v.id === variant.id;
                const perUnit = pricePerUnit(v);
                const discount =
                  v.units > 1 ? Math.round((1 - perUnit / baseUnitPrice) * 100) : 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariant(v)}
                    aria-pressed={selected}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-4 shrink-0 ${
                        selected ? 'border-emerald-600 bg-white' : 'border-slate-200 bg-white'
                      }`}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-800 leading-snug">
                        {v.label}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {brl(perUnit)} por porção{' '}
                        {discount > 0 && (
                          <span className="ml-1.5 font-bold text-emerald-700">
                            economize {discount}%
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 shrink-0">
                      {brl(v.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              O que vem no kit
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {product.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-lg font-medium"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Adicionais — principal alavanca de ticket médio */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Turbinar o kit
            </h3>
            <div className="space-y-2">
              {AVAILABLE_ADDONS.map((addon) => {
                const selected = addons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    aria-pressed={selected}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        selected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <span className="flex-1 text-sm text-slate-700 leading-snug">{addon.name}</span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm font-bold text-emerald-700">
                        + {brl(addon.price * variant.units)}
                      </span>
                      {variant.units > 1 && (
                        <span className="block text-[10px] text-slate-400 leading-none">
                          {brl(addon.price)} × {variant.units}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="item-notes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
            >
              Alguma preferência?
            </label>
            <input
              id="item-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={120}
              placeholder="Ex: sem gengibre, banana bem madura"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Rodapé fixo */}
        <div className="shrink-0 border-t border-slate-100 p-4 flex items-center gap-3 bg-white rounded-b-3xl">
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity === 1}
              aria-label="Diminuir quantidade"
              className="p-2 text-slate-600 disabled:text-slate-300 hover:text-emerald-700"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_ITEM_QUANTITY, q + 1))}
              disabled={quantity === MAX_ITEM_QUANTITY}
              aria-label="Aumentar quantidade"
              className="p-2 text-slate-600 disabled:text-slate-300 hover:text-emerald-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onConfirm(product, variant, quantity, addons, notes)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-between px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span className="text-sm">Adicionar à sacola</span>
            <span className="text-sm font-extrabold">{brl(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
