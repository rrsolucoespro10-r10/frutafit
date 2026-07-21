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

## O que se vende

Cada kit tem dois formatos ([`src/data/products.ts`](src/data/products.ts)):

- **1 unidade** — porta de entrada, para quem nunca provou.
- **Pacote semanal · 10 unidades** — o carro-chefe. Uma rota abastece a semana
  inteira do cliente, com preço por porção menor.

Adicional é cobrado **por porção** e multiplicado pelo tamanho do pacote: whey
num pacote de 10 vai em dez porções e custa dez vezes. A tela mostra a conta
(`R$ 4,50 × 10`) para não parecer erro.

## Área de cobertura

Operação no Agreste de Pernambuco, sede em Taquaritinga do Norte. Cada cidade é
uma entrada em `CITIES` ([`src/config.ts`](src/config.ts)) com regra própria:

| Cidade                   | Modo        | Rota          | Mínimo | Frete grátis |
| ------------------------ | ----------- | ------------- | ------ | ------------ |
| Taquaritinga (sede)      | `same_day`  | diária        | R$ 30  | R$ 100       |
| Santa Cruz do Capibaribe | `scheduled` | terça e sexta | R$ 60  | R$ 130       |
| Caruaru (~50 km)         | `scheduled` | **desligada** | R$ 120 | R$ 250       |

Caruaru está com `active: false`: a cidade continua cadastrada, só não aparece
para o cliente. Vire para `true` quando a cadeia de frio nos ~50 km estiver
resolvida — não antes de saber quanto tempo o produto aguenta em trânsito.

`same_day` promete minutos; `scheduled` promete **data**. Produto congelado
viajando 75 km sem dia certo é reclamação garantida — por isso cidade distante
tem mínimo maior e a tela mostra "chega sexta-feira, 24/07" em vez de "~50 min".
Pedido feito depois do `cutoffHour` no dia da rota cai para a rota seguinte.

> **Os bairros e as taxas estão semeados, não confirmados.** Revise um a um antes
> de divulgar o link: bairro listado que a rota não atende vira pedido cancelado.

## Outras chaves de operação

| Constante           | O que é                                             |
| ------------------- | --------------------------------------------------- |
| `DEFAULT_CITY_ID`   | Cidade pré-selecionada no checkout.                  |
| `PICKUP_MIN_ORDER`  | Mínimo para retirada (sem custo de rota).            |
| `OPENING_HOURS`     | Horário de recebimento de pedidos (0 = domingo).     |
| `MAX_ITEM_QUANTITY` | Teto de unidades por linha do carrinho.              |

Enquanto o cliente não escolhe o bairro, o frete exibido é a **maior** taxa da
cidade, de propósito: se o número tem que mudar, que mude para baixo.

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

- **Bairros e taxas** precisam ser confirmados contra a rota real.
- **Preços dos kits são placeholder.** Monte a partir do seu custo por porção,
  não do preço do concorrente. Se o pacote de 10 não tiver margem melhor que a
  unidade, o modelo semanal entrega o mesmo trabalho por menos dinheiro.
- **Cadeia de frio.** O código já promete data em vez de minutos nas cidades
  agendadas, mas a caixa térmica e o tempo máximo em trânsito são decisão de
  operação — e é o que determina se Caruaru entra ou não.
- **Imagens hospedadas no Unsplash.** Além de não serem o produto real, são
  dependência externa no caminho crítico do carregamento em 4G.
