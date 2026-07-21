import { useState } from 'react';
import { Send, Store, Truck, X } from 'lucide-react';
import type { CustomerDetails, FormErrors, OrderTotals, PaymentMethod } from '../types';
import { ACTIVE_CITIES, PAYMENT_LABELS, deliveryPromise, getCity } from '../config';
import { brl, isValidPhone, maskPhone } from '../lib/format';
import { useModalBehavior } from '../hooks/useModalBehavior';

interface Props {
  customer: CustomerDetails;
  totals: OrderTotals;
  isSubmitting: boolean;
  onChange: (patch: Partial<CustomerDetails>) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function validate(customer: CustomerDetails): FormErrors {
  const errors: FormErrors = {};

  if (customer.name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.';
  }
  if (!isValidPhone(customer.phone)) {
    errors.phone = 'Telefone incompleto. Use DDD + número.';
  }
  if (customer.deliveryType === 'delivery') {
    if (customer.address.trim().length < 6) {
      errors.address = 'Informe rua e número.';
    }
    if (!customer.city) {
      errors.city = 'Escolha a cidade.';
    }
    if (!customer.neighborhood) {
      errors.neighborhood = 'Escolha o bairro para calcularmos a entrega.';
    }
  }
  return errors;
}

/** Erro inline em vez de alert(): alert derruba o teclado e mata conversão no celular. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[11px] text-red-600 mt-1">
      {message}
    </p>
  );
}

export function CheckoutModal({
  customer,
  totals,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const [errors, setErrors] = useState<FormErrors>({});
  const isDelivery = customer.deliveryType === 'delivery';
  const city = getCity(customer.city);
  const isScheduled = city.mode === 'scheduled';

  useModalBehavior(onClose);

  /**
   * Trocar de cidade zera o bairro: id de bairro de Caruaru não existe em Santa
   * Cruz, e um bairro órfão faria o frete cair na taxa padrão sem o cliente
   * perceber.
   */
  const handleCityChange = (cityId: string) => onChange({ city: cityId, neighborhood: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(customer);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit();
  };

  const inputClass = (hasError?: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-red-400 focus:ring-red-400/40'
        : 'border-slate-200 focus:ring-emerald-500/40 focus:border-emerald-400'
    }`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar pedido"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 rounded-t-3xl sm:rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-800">Finalizar pedido</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4" noValidate>
          {/* Entrega ou retirada: o tipo existia nos dados mas não tinha
              controle na tela, então quem queria retirar não conseguia comprar. */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Como você quer receber?
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'delivery', label: 'Entrega', icon: Truck },
                  { value: 'pickup', label: 'Retirar no local', icon: Store },
                ] as const
              ).map(({ value, label, icon: Icon }) => {
                const active = customer.deliveryType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onChange({ deliveryType: value })}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            {!isDelivery &&
              (city.pickup ? (
                <p className="text-xs text-slate-500 mt-2">
                  Retirada em {city.pickup.address} · {city.pickup.hours}.
                </p>
              ) : (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                  Ainda não temos ponto de retirada em {city.name}. Escolha entrega ou fale com a
                  gente no WhatsApp.
                </p>
              ))}
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={customer.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Ex: Maria Silva"
              autoComplete="name"
              className={inputClass(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={customer.phone}
              onChange={(e) => onChange({ phone: maskPhone(e.target.value) })}
              placeholder="(81) 90000-0000"
              autoComplete="tel"
              className={inputClass(errors.phone)}
            />
            <FieldError message={errors.phone} />
          </div>

          {isDelivery && (
            <>
              <div>
                <label htmlFor="city" className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade
                </label>
                <select
                  id="city"
                  value={customer.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className={`${inputClass(errors.city)} bg-white`}
                >
                  {ACTIVE_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.state}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.city} />

                {/* Rota agendada: a promessa é data, nunca minutos. Dizer isso
                    aqui, antes do pagamento, evita a cobrança de "cadê meu
                    pedido?" duas horas depois. */}
                {isScheduled && (
                  <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 mt-2">
                    Em {city.name} entregamos em dias fixos. Seu pedido chega{' '}
                    <strong>{deliveryPromise(city, customer.neighborhood)}</strong>.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-semibold text-slate-700 mb-1">
                  Rua e número
                </label>
                <input
                  id="address"
                  type="text"
                  value={customer.address}
                  onChange={(e) => onChange({ address: e.target.value })}
                  placeholder="Ex: Rua das Acácias, 240"
                  autoComplete="street-address"
                  className={inputClass(errors.address)}
                />
                <FieldError message={errors.address} />
              </div>

              <div>
                <label
                  htmlFor="neighborhood"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Bairro
                </label>
                <select
                  id="neighborhood"
                  value={customer.neighborhood}
                  onChange={(e) => onChange({ neighborhood: e.target.value })}
                  className={`${inputClass(errors.neighborhood)} bg-white`}
                >
                  <option value="">Selecione o bairro</option>
                  {city.zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} — {brl(zone.fee)}
                      {zone.etaMinutes ? ` · ~${zone.etaMinutes} min` : ''}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.neighborhood} />
              </div>

              <div>
                <label
                  htmlFor="complement"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Complemento e ponto de referência
                </label>
                <input
                  id="complement"
                  type="text"
                  value={customer.complement}
                  onChange={(e) => onChange({ complement: e.target.value })}
                  placeholder="Ex: apto 302, portão azul"
                  className={inputClass()}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="payment" className="block text-xs font-semibold text-slate-700 mb-1">
              Forma de pagamento
            </label>
            <select
              id="payment"
              value={customer.paymentMethod}
              onChange={(e) =>
                onChange({ paymentMethod: e.target.value as PaymentMethod })
              }
              className={`${inputClass()} bg-white`}
            >
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {customer.paymentMethod === 'cash' && (
            <div>
              <label htmlFor="change" className="block text-xs font-semibold text-slate-700 mb-1">
                Precisa de troco para quanto?
              </label>
              <input
                id="change"
                type="text"
                value={customer.changeFor}
                onChange={(e) => onChange({ changeFor: e.target.value })}
                placeholder="Ex: R$ 50,00"
                className={inputClass()}
              />
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              id="notes"
              rows={2}
              value={customer.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Ex: entregar depois das 14h, campainha quebrada"
              className={`${inputClass()} resize-none`}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{brl(totals.subtotal)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Entrega</span>
                <span>{totals.deliveryFee === 0 ? 'grátis' : brl(totals.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-xl font-bold text-emerald-600">{brl(totals.total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {isSubmitting ? 'Enviando…' : 'Enviar pedido pelo WhatsApp'}
            {!isSubmitting && <Send className="w-4 h-4" />}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            O pedido só é confirmado depois da nossa resposta no WhatsApp.
          </p>
        </form>
      </div>
    </div>
  );
}
