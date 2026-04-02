-- Run this script in the Supabase SQL Editor to enable the Vehicles module.

create extension if not exists "uuid-ossp";

create table if not exists public.vehicles (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    customer_id uuid not null references public.customers(id) on delete cascade,
    plate text not null,
    brand text,
    model text not null,
    year text,
    color text,
    fuel text,
    mileage integer,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vehicles enable row level security;

drop policy if exists "Clientes podem ver os proprios veiculos." on public.vehicles;
drop policy if exists "Clientes podem inserir os proprios veiculos." on public.vehicles;
drop policy if exists "Clientes podem atualizar os proprios veiculos." on public.vehicles;
drop policy if exists "Clientes podem excluir os proprios veiculos." on public.vehicles;
drop policy if exists "Superadmins podem ver todos os veiculos." on public.vehicles;
drop policy if exists "Superadmins podem atualizar todos os veiculos." on public.vehicles;
drop policy if exists "Superadmins podem excluir todos os veiculos." on public.vehicles;

create policy "Clientes podem ver os proprios veiculos."
    on public.vehicles for select
    using (auth.uid() = owner_id);

create policy "Superadmins podem ver todos os veiculos."
    on public.vehicles for select
    using (public.is_superadmin(auth.uid()));

create policy "Clientes podem inserir os proprios veiculos."
    on public.vehicles for insert
    with check (auth.uid() = owner_id);

create policy "Clientes podem atualizar os proprios veiculos."
    on public.vehicles for update
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

create policy "Superadmins podem atualizar todos os veiculos."
    on public.vehicles for update
    using (public.is_superadmin(auth.uid()))
    with check (public.is_superadmin(auth.uid()));

create policy "Clientes podem excluir os proprios veiculos."
    on public.vehicles for delete
    using (auth.uid() = owner_id);

create policy "Superadmins podem excluir todos os veiculos."
    on public.vehicles for delete
    using (public.is_superadmin(auth.uid()));
