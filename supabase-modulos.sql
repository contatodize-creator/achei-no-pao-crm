-- Achei no Pão CRM: módulos adicionais (execute no SQL Editor do Supabase)
create table if not exists public.ap_leads (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid(),
 client_id uuid references public.ap_clients(id) on delete set null,
 company_name text not null,
 contact_name text,
 phone text,
 city text,
 amount numeric(12,2) not null default 0,
 stage text not null default 'prospeccao' check (stage in ('prospeccao','contato','negociacao','proposta','ganho','perdido')),
 next_contact date,
 notes text,
 created_at timestamptz not null default now()
);
create table if not exists public.ap_bakeries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid(),
 name text not null,
 contact_name text,
 phone text,
 city text,
 address text,
 notes text,
 created_at timestamptz not null default now()
);
create table if not exists public.ap_deliveries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid(),
 bakery_id uuid not null references public.ap_bakeries(id) on delete cascade,
 campaign_id uuid not null references public.ap_campaigns(id) on delete cascade,
 quantity integer not null check(quantity > 0),
 delivery_date date,
 status text not null default 'planejada' check(status in ('planejada','entregue')),
 notes text,
 created_at timestamptz not null default now()
);
create table if not exists public.ap_tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid(),
 title text not null,
 due_on date,
 done boolean not null default false,
 notes text,
 created_at timestamptz not null default now()
);
-- Compatibilidade com tabelas preexistentes que utilizam owner_id.
-- Não remove colunas, tabelas ou registros.
do $$
declare t text; col text;
begin
 foreach t in array array['ap_leads','ap_bakeries','ap_deliveries','ap_tasks'] loop
  select column_name into col from information_schema.columns
   where table_schema='public' and table_name=t and column_name in ('owner_id','user_id')
   order by case when column_name='owner_id' then 0 else 1 end limit 1;
  if col is null then
   execute format('alter table public.%I add column user_id uuid default auth.uid()',t);
   col := 'user_id';
  end if;
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists owner_access on public.%I',t);
  execute format('create policy owner_access on public.%I for all to authenticated using (%I = auth.uid()) with check (%I = auth.uid())',t,col,col);
 end loop;
end $$;
