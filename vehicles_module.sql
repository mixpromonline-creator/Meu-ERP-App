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
    transmission text,
    mileage integer,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.vehicle_brands (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    sort_order integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.vehicle_models (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid not null references public.vehicle_brands(id) on delete cascade,
    name text not null,
    sort_order integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (brand_id, name)
);

alter table public.vehicles enable row level security;
alter table public.vehicle_brands enable row level security;
alter table public.vehicle_models enable row level security;

alter table public.vehicles
    add column if not exists transmission text;

drop policy if exists "Clientes podem ver os proprios veiculos." on public.vehicles;
drop policy if exists "Clientes podem inserir os proprios veiculos." on public.vehicles;
drop policy if exists "Clientes podem atualizar os proprios veiculos." on public.vehicles;
drop policy if exists "Clientes podem excluir os proprios veiculos." on public.vehicles;
drop policy if exists "Superadmins podem ver todos os veiculos." on public.vehicles;
drop policy if exists "Superadmins podem atualizar todos os veiculos." on public.vehicles;
drop policy if exists "Superadmins podem excluir todos os veiculos." on public.vehicles;
drop policy if exists "Usuarios autenticados podem ver marcas de veiculos." on public.vehicle_brands;
drop policy if exists "Usuarios autenticados podem ver modelos de veiculos." on public.vehicle_models;

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

create policy "Usuarios autenticados podem ver marcas de veiculos."
    on public.vehicle_brands for select
    using (auth.uid() is not null);

create policy "Usuarios autenticados podem ver modelos de veiculos."
    on public.vehicle_models for select
    using (auth.uid() is not null);

insert into public.vehicle_brands (name, sort_order)
values
    ('Audi', 1),
    ('BMW', 2),
    ('Chevrolet', 3),
    ('Citroen', 4),
    ('Fiat', 5),
    ('Ford', 6),
    ('Honda', 7),
    ('Hyundai', 8),
    ('Jeep', 9),
    ('Mercedes-Benz', 10),
    ('Mitsubishi', 11),
    ('Nissan', 12),
    ('Peugeot', 13),
    ('Renault', 14),
    ('Toyota', 15),
    ('Volkswagen', 16)
on conflict (name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('A1', 1), ('A3', 2), ('A4', 3), ('Q3', 4), ('Q5', 5)
) as models(model_name, sort_order)
where vb.name = 'Audi'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('320i', 1), ('X1', 2), ('X3', 3), ('X5', 4), ('118i', 5)
) as models(model_name, sort_order)
where vb.name = 'BMW'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Onix', 1), ('Onix Plus', 2), ('Prisma', 3), ('Cruze', 4), ('Tracker', 5), ('S10', 6), ('Montana', 7), ('Spin', 8)
) as models(model_name, sort_order)
where vb.name = 'Chevrolet'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('C3', 1), ('Aircross', 2), ('C4 Cactus', 3), ('C4 Lounge', 4), ('Jumpy', 5)
) as models(model_name, sort_order)
where vb.name = 'Citroen'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Mobi', 1), ('Uno', 2), ('Argo', 3), ('Cronos', 4), ('Pulse', 5), ('Fastback', 6), ('Toro', 7), ('Strada', 8), ('Fiorino', 9), ('Ducato', 10)
) as models(model_name, sort_order)
where vb.name = 'Fiat'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Ka', 1), ('Fiesta', 2), ('Focus', 3), ('EcoSport', 4), ('Ranger', 5), ('Territory', 6)
) as models(model_name, sort_order)
where vb.name = 'Ford'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Fit', 1), ('City', 2), ('Civic', 3), ('HR-V', 4), ('WR-V', 5), ('CR-V', 6)
) as models(model_name, sort_order)
where vb.name = 'Honda'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('HB20', 1), ('HB20S', 2), ('Creta', 3), ('Tucson', 4), ('ix35', 5), ('Santa Fe', 6)
) as models(model_name, sort_order)
where vb.name = 'Hyundai'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Renegade', 1), ('Compass', 2), ('Commander', 3), ('Gladiator', 4), ('Wrangler', 5)
) as models(model_name, sort_order)
where vb.name = 'Jeep'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Classe A', 1), ('Classe C', 2), ('CLA 200', 3), ('GLA 200', 4), ('Sprinter', 5)
) as models(model_name, sort_order)
where vb.name = 'Mercedes-Benz'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('L200 Triton', 1), ('Pajero Sport', 2), ('Outlander', 3), ('ASX', 4), ('Eclipse Cross', 5)
) as models(model_name, sort_order)
where vb.name = 'Mitsubishi'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('March', 1), ('Versa', 2), ('Sentra', 3), ('Kicks', 4), ('Frontier', 5)
) as models(model_name, sort_order)
where vb.name = 'Nissan'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('208', 1), ('2008', 2), ('3008', 3), ('Partner', 4), ('Boxer', 5)
) as models(model_name, sort_order)
where vb.name = 'Peugeot'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Kwid', 1), ('Sandero', 2), ('Logan', 3), ('Duster', 4), ('Oroch', 5), ('Master', 6)
) as models(model_name, sort_order)
where vb.name = 'Renault'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Etios', 1), ('Yaris', 2), ('Corolla', 3), ('Corolla Cross', 4), ('Hilux', 5), ('SW4', 6)
) as models(model_name, sort_order)
where vb.name = 'Toyota'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Gol', 1), ('Polo', 2), ('Virtus', 3), ('Saveiro', 4), ('Nivus', 5), ('T-Cross', 6), ('Taos', 7), ('Amarok', 8)
) as models(model_name, sort_order)
where vb.name = 'Volkswagen'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

