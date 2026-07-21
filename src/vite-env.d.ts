/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Número que recebe os pedidos: 55 + DDD + número, só dígitos. */
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
