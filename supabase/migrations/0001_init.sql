-- FrutaFit — esquema inicial
--
-- Duas decisões que valem para o banco inteiro:
--
-- 1. DINHEIRO EM CENTAVOS (integer), nunca float. `numeric` também serviria,
--    mas centavos em integer atravessam JSON, JavaScript e planilha sem nunca
--    virar 0.1 + 0.2 = 0.30000000000000004. O app converte na borda.
--
-- 2. O PEDIDO GUARDA CÓPIA do nome e do preço praticados. Se em setembro o kit
--    subir de R$ 59,90 para R$ 64,90, o pedido de agosto tem que continuar
--    dizendo R$ 59,90 — senão o faturamento do passado muda sozinho toda vez
--    que você mexe na tabela de preços, e nenhum relatório fecha.

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  tagline      text not null default '',
  category     text not null,
  unit_weight  text not null default '',
  unit_yield   text not null default '',
  calories     integer not null default 0,
  ingredients  text[] not null default '{}',
  image_url    text not null default '',
  is_popular   boolean not null default false,
  is_available boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  code        text not null,
  label       text not null,
  short_label text not null,
  -- Porções dentro do formato. É o multiplicador do preço dos adicionais.
  units       integer not null check (units > 0),
  price_cents integer not null check (price_cents >= 0),
  is_active   boolean not null default true,
  unique (product_id, code)
);

create table public.addons (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  short_name  text not null,
  -- Preço POR PORÇÃO. No pacote de 10 entra dez vezes.
  price_cents integer not null check (price_cents >= 0),
  is_active   boolean not null default true,
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Cobertura
-- ---------------------------------------------------------------------------

create table public.cities (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  state               text not null default 'PE',
  active              boolean not null default true,
  min_order_cents     integer not null default 0,
  free_shipping_cents integer not null default 0,
  pickup_address      text,
  pickup_hours        text,
  sort_order          integer not null default 0
);

create table public.delivery_zones (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references public.cities(id) on delete cascade,
  slug        text not null,
  name        text not null,
  fee_cents   integer not null check (fee_cents >= 0),
  eta_minutes integer not null default 60,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  unique (city_id, slug)
);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------

create type public.order_status as enum (
  'novo', 'confirmado', 'em_producao', 'saiu_entrega', 'entregue', 'cancelado'
);

create type public.delivery_type as enum ('delivery', 'pickup');

create type public.payment_method as enum ('pix', 'card_delivery', 'cash');

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  status             public.order_status not null default 'novo',

  customer_name      text not null,
  customer_phone     text not null,

  delivery_type      public.delivery_type not null,
  -- Cópia do nome da cidade e do bairro: se você renomear ou desativar um
  -- bairro depois, o pedido antigo continua legível.
  city_id            uuid references public.cities(id) on delete set null,
  city_name          text not null default '',
  zone_id            uuid references public.delivery_zones(id) on delete set null,
  zone_name          text not null default '',
  address            text not null default '',
  complement         text not null default '',

  payment_method     public.payment_method not null,
  change_for         text not null default '',
  notes              text not null default '',

  subtotal_cents     integer not null check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  total_cents        integer not null check (total_cents >= 0),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,

  product_id       uuid references public.products(id) on delete set null,
  product_name     text not null,
  variant_code     text not null,
  variant_label    text not null,
  variant_units    integer not null check (variant_units > 0),

  quantity         integer not null check (quantity > 0),
  -- Preço de UMA unidade da linha (um pacote), já com adicionais somados.
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  notes            text not null default ''
);

create table public.order_item_addons (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  addon_code    text not null,
  addon_name    text not null,
  -- Preço por porção praticado no dia do pedido.
  price_cents   integer not null check (price_cents >= 0)
);

-- Índices dos caminhos que o painel realmente percorre.
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx     on public.orders (status);
create index orders_city_idx       on public.orders (city_id);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_prod_idx  on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Relatórios
--
-- Views em vez de consulta solta no front: a regra de "o que conta como venda"
-- (pedido cancelado não fatura) fica num lugar só.
-- ---------------------------------------------------------------------------

create view public.v_vendas_por_dia
with (security_invoker = true) as
select
  (created_at at time zone 'America/Recife')::date as dia,
  count(*)                                          as pedidos,
  sum(total_cents)                                  as faturamento_cents,
  sum(subtotal_cents)                               as produtos_cents,
  sum(delivery_fee_cents)                           as frete_cents,
  round(avg(total_cents))::integer                  as ticket_medio_cents
from public.orders
where status <> 'cancelado'
group by 1
order by 1 desc;

create view public.v_ranking_kits
with (security_invoker = true) as
select
  i.product_id,
  i.product_name,
  sum(i.quantity)                          as pacotes,
  sum(i.quantity * i.variant_units)        as porcoes,
  sum(i.line_total_cents)                  as faturamento_cents,
  count(distinct o.id)                     as pedidos
from public.order_items i
join public.orders o on o.id = i.order_id
where o.status <> 'cancelado'
group by 1, 2
order by faturamento_cents desc;

create view public.v_desempenho_cidade
with (security_invoker = true) as
select
  coalesce(nullif(o.city_name, ''), 'Retirada') as cidade,
  o.zone_name                                    as bairro,
  count(*)                                       as pedidos,
  sum(o.total_cents)                             as faturamento_cents,
  sum(o.delivery_fee_cents)                      as frete_cobrado_cents,
  round(avg(o.total_cents))::integer             as ticket_medio_cents
from public.orders o
where o.status <> 'cancelado'
group by 1, 2
order by faturamento_cents desc;

-- ---------------------------------------------------------------------------
-- RLS
--
-- O cliente não tem login: a loja lê o catálogo como anônimo e grava o pedido
-- como anônimo. O que ele NÃO pode é ler pedido — sem isso, qualquer pessoa
-- baixaria a lista de telefones e endereços dos seus clientes.
-- ---------------------------------------------------------------------------

alter table public.products          enable row level security;
alter table public.product_variants  enable row level security;
alter table public.addons            enable row level security;
alter table public.cities            enable row level security;
alter table public.delivery_zones    enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.order_item_addons enable row level security;

-- Catálogo: leitura pública só do que está ativo.
create policy "catalogo publico" on public.products
  for select to anon, authenticated using (is_available);

create policy "variantes publicas" on public.product_variants
  for select to anon, authenticated using (is_active);

create policy "adicionais publicos" on public.addons
  for select to anon, authenticated using (is_active);

create policy "cidades publicas" on public.cities
  for select to anon, authenticated using (active);

create policy "bairros publicos" on public.delivery_zones
  for select to anon, authenticated using (active);

-- Pedido: anônimo grava, ninguém anônimo lê.
create policy "cliente cria pedido" on public.orders
  for insert to anon, authenticated with check (true);

create policy "cliente cria itens" on public.order_items
  for insert to anon, authenticated with check (true);

create policy "cliente cria adicionais" on public.order_item_addons
  for insert to anon, authenticated with check (true);

-- Admin: quem estiver logado enxerga e administra tudo. Como só existe uma
-- conta (a sua), autenticado == administrador. No dia em que houver entregador
-- com login, isto vira checagem de papel.
create policy "admin le pedidos" on public.orders
  for select to authenticated using (true);

create policy "admin atualiza pedidos" on public.orders
  for update to authenticated using (true) with check (true);

create policy "admin le itens" on public.order_items
  for select to authenticated using (true);

create policy "admin le adicionais" on public.order_item_addons
  for select to authenticated using (true);

create policy "admin administra catalogo" on public.products
  for all to authenticated using (true) with check (true);

create policy "admin administra variantes" on public.product_variants
  for all to authenticated using (true) with check (true);

create policy "admin administra adicionais" on public.addons
  for all to authenticated using (true) with check (true);

create policy "admin administra cidades" on public.cities
  for all to authenticated using (true) with check (true);

create policy "admin administra bairros" on public.delivery_zones
  for all to authenticated using (true) with check (true);
