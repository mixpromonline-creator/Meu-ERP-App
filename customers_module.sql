-- Run this script in the Supabase SQL Editor to enable the Customers module.

create extension if not exists "uuid-ossp";

create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    phone text,
    email text,
    address text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.customers enable row level security;

drop policy if exists "Clientes podem ver os proprios clientes." on public.customers;
drop policy if exists "Clientes podem inserir os proprios clientes." on public.customers;
drop policy if exists "Clientes podem atualizar os proprios clientes." on public.customers;
drop policy if exists "Clientes podem excluir os proprios clientes." on public.customers;
drop policy if exists "Superadmins podem ver todos os clientes." on public.customers;
drop policy if exists "Superadmins podem atualizar todos os clientes." on public.customers;
drop policy if exists "Superadmins podem excluir todos os clientes." on public.customers;

create policy "Clientes podem ver os proprios clientes."
    on public.customers for select
    using (auth.uid() = owner_id);

create policy "Superadmins podem ver todos os clientes."
    on public.customers for select
    using (public.is_superadmin(auth.uid()));

create policy "Clientes podem inserir os proprios clientes."
    on public.customers for insert
    with check (auth.uid() = owner_id);

create policy "Clientes podem atualizar os proprios clientes."
    on public.customers for update
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

create policy "Superadmins podem atualizar todos os clientes."
    on public.customers for update
    using (public.is_superadmin(auth.uid()))
    with check (public.is_superadmin(auth.uid()));

create policy "Clientes podem excluir os proprios clientes."
    on public.customers for delete
    using (auth.uid() = owner_id);

create policy "Superadmins podem excluir todos os clientes."
    on public.customers for delete
    using (public.is_superadmin(auth.uid()));
