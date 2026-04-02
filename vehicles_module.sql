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
    ('BYD', 4),
    ('Citroen', 4),
    ('CAOA Chery', 5),
    ('Fiat', 6),
    ('Ford', 7),
    ('GAC', 8),
    ('GWM', 9),
    ('Honda', 10),
    ('Hyundai', 11),
    ('JAC Motors', 12),
    ('Jeep', 13),
    ('Kia', 14),
    ('Mercedes-Benz', 15),
    ('Mitsubishi', 16),
    ('Nissan', 17),
    ('Omoda Jaecoo', 18),
    ('Peugeot', 19),
    ('Renault', 20),
    ('Toyota', 21),
    ('Volkswagen', 22)
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
        ('Dolphin Mini', 1), ('Dolphin', 2), ('King', 3), ('Song Pro', 4), ('Song Plus', 5), ('Yuan Pro', 6), ('Yuan Plus', 7), ('Seal', 8)
) as models(model_name, sort_order)
where vb.name = 'BYD'
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
        ('Tiggo 2', 1), ('Tiggo 3X', 2), ('Tiggo 5X', 3), ('Tiggo 7', 4), ('Tiggo 8', 5), ('Arrizo 5', 6), ('Arrizo 6', 7), ('QQ', 8)
) as models(model_name, sort_order)
where vb.name = 'CAOA Chery'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Mobi', 1), ('Uno', 2), ('Palio', 3), ('Siena', 4), ('Grand Siena', 5), ('Idea', 6), ('Punto', 7), ('Argo', 8), ('Cronos', 9), ('Pulse', 10), ('Fastback', 11), ('Toro', 12), ('Strada', 13), ('Fiorino', 14), ('Ducato', 15)
) as models(model_name, sort_order)
where vb.name = 'Fiat'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Ka', 1), ('Fiesta', 2), ('Focus', 3), ('Fusion', 4), ('EcoSport', 5), ('Edge', 6), ('Ranger', 7), ('Territory', 8)
) as models(model_name, sort_order)
where vb.name = 'Ford'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Aion Y', 1), ('Aion ES', 2), ('GS3', 3), ('Aion V', 4)
) as models(model_name, sort_order)
where vb.name = 'GAC'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Haval H6', 1), ('Ora 03', 2), ('Poer', 3), ('Tank 300', 4)
) as models(model_name, sort_order)
where vb.name = 'GWM'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Fit', 1), ('City', 2), ('Civic', 3), ('Accord', 4), ('HR-V', 5), ('WR-V', 6), ('CR-V', 7)
) as models(model_name, sort_order)
where vb.name = 'Honda'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('HB20', 1), ('HB20S', 2), ('Azera', 3), ('Creta', 4), ('Tucson', 5), ('ix35', 6), ('Santa Fe', 7), ('Kona', 8)
) as models(model_name, sort_order)
where vb.name = 'Hyundai'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('E-JS1', 1), ('E-J7', 2), ('T40', 3), ('T50', 4), ('T60', 5), ('Hunter', 6)
) as models(model_name, sort_order)
where vb.name = 'JAC Motors'
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
        ('Picanto', 1), ('Cerato', 2), ('Soul', 3), ('Sportage', 4), ('Sorento', 5), ('Carnival', 6), ('Niro', 7), ('Bongo', 8), ('Stonic', 9)
) as models(model_name, sort_order)
where vb.name = 'Kia'
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
        ('March', 1), ('Versa', 2), ('Sentra', 3), ('Kicks', 4), ('X-Trail', 5), ('Frontier', 6)
) as models(model_name, sort_order)
where vb.name = 'Nissan'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Omoda E5', 1), ('Jaecoo 7', 2)
) as models(model_name, sort_order)
where vb.name = 'Omoda Jaecoo'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('206', 1), ('207', 2), ('208', 3), ('307', 4), ('308', 5), ('2008', 6), ('3008', 7), ('Partner', 8), ('Boxer', 9)
) as models(model_name, sort_order)
where vb.name = 'Peugeot'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Clio', 1), ('Kwid', 2), ('Sandero', 3), ('Logan', 4), ('Symbol', 5), ('Duster', 6), ('Oroch', 7), ('Fluence', 8), ('Master', 9)
) as models(model_name, sort_order)
where vb.name = 'Renault'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Etios', 1), ('Yaris', 2), ('Corolla', 3), ('Corolla Cross', 4), ('Hilux', 5), ('SW4', 6), ('RAV4', 7)
) as models(model_name, sort_order)
where vb.name = 'Toyota'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Gol', 1), ('Fox', 2), ('Voyage', 3), ('Polo', 4), ('Virtus', 5), ('Saveiro', 6), ('Nivus', 7), ('T-Cross', 8), ('Taos', 9), ('Amarok', 10), ('Jetta', 11)
) as models(model_name, sort_order)
where vb.name = 'Volkswagen'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

insert into public.vehicle_models (brand_id, name, sort_order)
select vb.id, models.model_name, models.sort_order
from public.vehicle_brands vb
cross join lateral (
    values
        ('Celta', 1), ('Corsa', 2), ('Classic', 3), ('Prisma', 4), ('Cruze', 5), ('Astra', 6), ('Vectra', 7), ('Zafira', 8), ('Onix', 9), ('Tracker', 10), ('S10', 11), ('Montana', 12), ('Spin', 13)
) as models(model_name, sort_order)
where vb.name = 'Chevrolet'
on conflict (brand_id, name) do update
set sort_order = excluded.sort_order;

