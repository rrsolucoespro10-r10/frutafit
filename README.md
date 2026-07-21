# FrutaFit

Loja de kits de frutas congeladas com checkout via WhatsApp.
Vite + React 19 + TypeScript + Tailwind v4.

## Rodar

```bash
npm install
cp .env.example .env.local   # e coloque o número real
npm run dev
npm run build                # tsc -b && vite build
```

`.env.local` já é ignorado pelo git (`*.local`).

## Configurar antes de vender

Tudo que muda a operação vive em [`src/config.ts`](src/config.ts) — nenhuma
dessas mudanças exige mexer em componente:

| Constante                 | O que é                                                 |
| ------------------------- | ------------------------------------------------------- |
| `MIN_ORDER_VALUE`         | Pedido mínimo. Bloqueia o checkout abaixo disso.         |
| `FREE_SHIPPING_THRESHOLD` | Valor que zera o frete e alimenta a barra de progresso.  |
| `DELIVERY_ZONES`          | Bairros atendidos, taxa e previsão em minutos.           |
| `DEFAULT_DELIVERY_FEE`    | Taxa usada enquanto o cliente não escolheu bairro.       |
| `PICKUP_ADDRESS`          | Endereço mostrado na opção "retirar no local".           |
| `OPENING_HOURS`           | Horário por dia da semana (0 = domingo).                 |
| `MAX_ITEM_QUANTITY`       | Teto de unidades por linha do carrinho.                  |

O catálogo está em [`src/data/products.ts`](src/data/products.ts).

E `VITE_WHATSAPP_NUMBER` no `.env.local`: **só dígitos**, `55` + DDD + número.
Sem ele o app mostra um aviso vermelho e nenhum pedido é enviado.

## Regra que não pode quebrar

O total da tela e o total da mensagem do WhatsApp têm que ser o mesmo número.
Isso é garantido por um único lugar: as funções puras de
[`src/lib/cart.ts`](src/lib/cart.ts) (`unitPrice`, `lineTotal`), consumidas tanto
pelo `useCart` quanto pelo `buildOrderMessage`. Se precisar mudar o cálculo,
mude ali — nunca duplique a conta em um componente.

## Arquitetura

```
src/
├── types.ts                        tipos do domínio
├── config.ts                       regras da operação
├── data/products.ts                catálogo e adicionais
├── lib/format.ts                   moeda, busca sem acento, máscara de telefone
├── lib/cart.ts                     aritmética do carrinho (pura, sem React)
├── lib/whatsapp.ts                 mensagem do pedido + gancho de persistência
├── hooks/usePersistentState.ts     localStorage à prova de erro
├── hooks/useCart.ts                carrinho e totais
├── hooks/useModalBehavior.ts       Esc + trava de scroll compartilhada
├── components/                     ProductCard, ProductModal, CartDrawer, CheckoutModal
└── App.tsx                         composição
```

Camadas: `lib/` não importa de `hooks/`, e nenhum dos dois importa de
`components/`. Foi por isso que a aritmética do carrinho saiu do hook — o módulo
que formata texto não deve arrastar React junto.

## Próximos passos (ordem de retorno)

1. Trocar as fotos de banco por fotos reais dos kits. Maior impacto por hora.
2. Implementar `persistOrder` em [`src/lib/whatsapp.ts`](src/lib/whatsapp.ts) no
   Supabase. Sem isso não há histórico, ticket médio nem base para recompra.
   O timeout de 3s já está no lugar — mantenha.
3. Migrar `data/products.ts` para o Supabase: hoje mudar preço exige redeploy.
4. Order bump no carrinho: sugerir whey quando o kit for da categoria proteico.

## Pontos em aberto (decisão de negócio, não de código)

- **Pedido mínimo vale para retirada.** Hoje `MIN_ORDER_VALUE` bloqueia também
  quem vai buscar na loja, onde não existe custo de entrega. Quem quer um kit de
  R$ 14,90 e passaria aí para pegar simplesmente não consegue comprar. Se não for
  intencional, o mínimo deveria valer só para `delivery`.
- **Imagens hospedadas no Unsplash.** Além de não serem o produto real, são
  dependência externa no caminho crítico do carregamento em 4G.
