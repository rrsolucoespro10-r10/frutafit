import { useEffect } from 'react';

/**
 * Comportamento comum de modal: Esc fecha e o body para de rolar por trás.
 *
 * Estava só no modal de produto. Sacola e checkout ficavam com o fundo rolando
 * sob o dedo no celular — o cliente arrasta o formulário e a página anda junto.
 *
 * O contador é global porque os modais se sobrepõem: fechar um deles não pode
 * liberar o scroll enquanto o outro ainda está aberto.
 */
let openModals = 0;
let previousOverflow = '';

export function useModalBehavior(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    if (openModals === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openModals += 1;

    return () => {
      window.removeEventListener('keydown', onKey);
      openModals -= 1;
      if (openModals === 0) document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);
}
