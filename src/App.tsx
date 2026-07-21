import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';
import type { Addon, CustomerDetails, Product, ProductVariant } from './types';
import { CATEGORIES, PRODUCTS } from './data/products';
import { DEFAULT_CITY_ID, getCity, getZone, isStoreOpen } from './config';
import { brl, normalize } from './lib/format';
import {
  buildOrderMessage,
  generateOrderCode,
  isWhatsAppConfigured,
  openWhatsApp,
  persistOrder,
} from './lib/whatsapp';
import { usePersistentState } from './hooks/usePersistentState';
import { useCart } from './hooks/useCart';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';

const EMPTY_CUSTOMER: CustomerDetails = {
  name: '',
  phone: '',
  deliveryType: 'delivery',
  city: DEFAULT_CITY_ID,
  address: '',
  neighborhood: '',
  complement: '',
  paymentMethod: 'pix',
  changeFor: '',
  notes: '',
};

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // v3: o cadastro salvo em v2 não tem `city`. Sem a virada de chave, quem já
  // usou o app hidrataria com city undefined e o <select> de cidade viraria
  // descontrolado — some o frete e o React reclama no console.
  const [customer, setCustomer] = usePersistentState<CustomerDetails>(
    'fruta_fit_customer_v3',
    EMPTY_CUSTOMER,
  );

  const { cart, itemCount, addItem, changeQuantity, removeItem, clearCart, getTotals } = useCart();

  const totals = getTotals(customer.deliveryType, customer.city, customer.neighborhood);

  // Reavalia o horário de tempos em tempos: quem deixa a aba aberta a tarde
  // inteira continuaria vendo "loja aberta" depois do fechamento e mandaria
  // pedido que ninguém vai produzir.
  const [storeOpen, setStoreOpen] = useState(() => isStoreOpen());
  useEffect(() => {
    const id = setInterval(() => setStoreOpen(isStoreOpen()), 60_000);
    return () => clearInterval(id);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = normalize(searchQuery);
    return PRODUCTS.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        normalize(product.name).includes(query) ||
        normalize(product.tagline).includes(query) ||
        product.ingredients.some((ing) => normalize(ing).includes(query))
      );
    });
  }, [selectedCategory, searchQuery]);

  const updateCustomer = (patch: Partial<CustomerDetails>) =>
    setCustomer((prev) => ({ ...prev, ...patch }));

  const handleAddToCart = (
    product: Product,
    variant: ProductVariant,
    quantity: number,
    addons: Addon[],
    notes: string,
  ) => {
    addItem(product, variant, quantity, addons, notes);
    setActiveProduct(null);
    setIsCartOpen(true);
  };

  const handleSubmitOrder = async () => {
    // Sem número configurado o pedido não tem para onde ir. Sair cedo aqui evita
    // o pior caso: limpar a sacola do cliente por um pedido que nunca foi enviado.
    if (!isWhatsAppConfigured()) {
      console.error('[FrutaFit] VITE_WHATSAPP_NUMBER ausente ou inválido; pedido não enviado.');
      return;
    }

    setIsSubmitting(true);
    const orderCode = generateOrderCode();

    // Grava primeiro, manda depois: sem registro não existe histórico,
    // ticket médio nem base de clientes para recompra.
    await persistOrder({ orderCode, cart, customer, totals });

    // A sacola é limpa antes de navegar porque openWhatsApp troca a página:
    // qualquer coisa depois dele pode nunca rodar. O pedido já está gravado.
    clearCart();
    setIsCheckoutOpen(false);
    setIsSubmitting(false);

    openWhatsApp(buildOrderMessage(cart, customer, totals, orderCode));
  };

  const currentCity = getCity(customer.city);
  const currentZone = getZone(customer.city, customer.neighborhood);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans antialiased pb-28 selection:bg-emerald-200">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                Fruta<span className="text-emerald-600">Fit</span>
              </h1>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Kits de frutas congeladas
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="max-w-[130px] truncate">
              {customer.deliveryType === 'pickup'
                ? 'Retirada'
                : currentZone
                  ? `${currentZone.name}, ${currentCity.name}`
                  : `Definir bairro · ${currentCity.name}`}
            </span>
          </button>
        </div>

        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por morango, detox, açaí, whey…"
              aria-label="Buscar kits"
              className="w-full bg-slate-100/80 text-sm pl-10 pr-9 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 border border-transparent focus:border-emerald-300"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pb-3 overflow-x-auto no-scrollbar flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* Aviso para o operador, não para o cliente: sem esse número nenhum
            pedido sai, e o sintoma sozinho (botão que não faz nada) é difícil
            de diagnosticar depois que o site está no ar. */}
        {!isWhatsAppConfigured() && (
          <div className="bg-red-600 text-white rounded-2xl p-4">
            <p className="font-bold text-sm">Loja não configurada</p>
            <p className="text-xs text-red-100 mt-1">
              Defina <code className="font-mono">VITE_WHATSAPP_NUMBER</code> (55 + DDD + número) no
              .env.local e refaça o build. Enquanto isso, nenhum pedido é enviado.
            </p>
          </div>
        )}

        {!storeOpen && (
          <div className="bg-slate-900 text-white rounded-2xl p-4">
            <p className="font-bold text-sm">Estamos fechados agora</p>
            <p className="text-xs text-slate-300 mt-1">
              Pode montar sua sacola normalmente — o pedido entra na fila da próxima abertura.
            </p>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 shadow-lg shadow-emerald-900/10">
          <div className="relative z-10 max-w-[240px] space-y-1.5">
            <span className="inline-block bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
              100% natural, sem açúcar
            </span>
            <h2 className="text-lg font-bold leading-snug">
              Frutas cortadas e congeladas na porção exata.
            </h2>
            <p className="text-xs text-emerald-100/80">
              Joga no liquidificador com água, leite ou água de coco. Pronto em 30 segundos.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              Cardápio de kits
              <span className="text-xs font-normal text-slate-400">({filteredProducts.length})</span>
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
              <p className="text-slate-600 font-semibold">Nenhum kit com esse nome</p>
              <p className="text-sm text-slate-400 mt-1">Tente outra fruta ou limpe a busca.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Ver todos os kits
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={setActiveProduct} />
              ))}
            </div>
          )}
        </section>

        <section className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-0.5">
            <h5 className="font-bold">Frescor garantido</h5>
            <p className="text-amber-800/80 leading-relaxed">
              Frutas higienizadas e congeladas no pico de maturação. Sem conservantes, corantes ou
              açúcar adicionado.
            </p>
          </div>
        </section>
      </main>

      {/* Barra flutuante da sacola */}
      {itemCount > 0 && !isCartOpen && !isCheckoutOpen && !activeProduct && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="bg-emerald-800/40 px-2.5 py-1 rounded-lg text-sm font-bold">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
                <span className="text-sm">Ver sacola</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{brl(totals.total)}</span>
                <ShoppingBag className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {activeProduct && (
        <ProductModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onConfirm={handleAddToCart}
        />
      )}

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          totals={totals}
          isDelivery={customer.deliveryType === 'delivery'}
          onClose={() => setIsCartOpen(false)}
          onChangeQuantity={changeQuantity}
          onRemove={removeItem}
          onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          customer={customer}
          totals={totals}
          isSubmitting={isSubmitting}
          onChange={updateCustomer}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </div>
  );
}
