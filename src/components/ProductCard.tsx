import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { brl } from '../lib/format';
import { cheapestVariant, packSavingsPercent } from '../lib/cart';

interface Props {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: Props) {
  // "A partir de" usa a unidade avulsa: mostrar o preço do pacote na vitrine
  // faria o cliente achar caro antes de entender que são 10 porções.
  const entry = cheapestVariant(product);
  const savings = packSavingsPercent(product);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group w-full text-left bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all active:scale-[0.99] flex gap-3.5"
    >
      <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:transform-none"
        />
        {product.isPopular && (
          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
            Mais pedido
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">
              {product.name}
            </h4>
            <span className="text-right shrink-0">
              <span className="block text-[9px] text-slate-400 leading-none">a partir de</span>
              <span className="text-xs font-extrabold text-emerald-700">{brl(entry.price)}</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{product.tagline}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {product.ingredients.slice(0, 3).map((ing) => (
              <span
                key={ing}
                className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              >
                {ing}
              </span>
            ))}
            {product.ingredients.length > 3 && (
              <span className="bg-slate-100 text-slate-400 text-[10px] px-1 py-0.5 rounded-md">
                +{product.ingredients.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
          {/* A economia do pacote é o argumento de venda central do modelo
              semanal: aparece já na vitrine, não só depois de abrir o produto. */}
          {savings > 0 ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Pacote 10 un · −{savings}%
            </span>
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span>{product.unitYield}</span>
              <span aria-hidden>•</span>
              <span>{product.calories} kcal</span>
            </div>
          )}

          <span className="bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-emerald-600/20">
            <Plus className="w-3.5 h-3.5" />
            Escolher
          </span>
        </div>
      </div>
    </button>
  );
}
