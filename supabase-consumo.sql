create table if not exists public.ap_bakery_consumption (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid(),
 bakery_id uuid not null,
 bag_kg integer not null check (bag_kg in (2,3,4,5,7)),
 daily_normal integer not null default 0 check (daily_normal>=0),
 daily_peak integer not null default 0 check (daily_peak>=0),
 safety_days integer not null default 7 check (safety_days between 0 and 60),
 updated_at timestamptz not null default now(),
 unique(user_id,bakery_id,bag_kg)
);
alter table public.ap_bakery_consumption enable row level security;
drop policy if exists bakery_consumption_owner on public.ap_bakery_consumption;
create policy bakery_consumption_owner on public.ap_bakery_consumption for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant select,insert,update,delete on public.ap_bakery_consumption to authenticated;
