import { useEffect, useState } from 'react';

/**
 * Estado persistido em localStorage.
 *
 * Por que não ler direto no initializer do useState:
 *  - quebra em SSR (window is not defined);
 *  - um JSON corrompido derruba o app do cliente para sempre, sem recuperação.
 * Aqui a hidratação acontece no efeito, com try/catch e fallback.
 *
 * O flag de hidratação é *state*, não ref: com ref, o efeito de escrita rodava
 * no mesmo commit da leitura ainda enxergando o valor inicial e gravava um
 * carrinho vazio por cima do carrinho salvo antes de reescrevê-lo. Como state,
 * `setState(salvo)` e `setHydrated(true)` entram no mesmo lote e a primeira
 * escrita já acontece com o valor correto.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      // dado inválido: descarta e segue com o valor inicial
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* storage indisponível (modo privado) */
      }
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* cota cheia ou storage bloqueado: ignora, não é crítico */
    }
  }, [key, state, hydrated]);

  return [state, setState] as const;
}
