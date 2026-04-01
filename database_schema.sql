-- SQL Schema Base para o ERP SaaS

-- Habilitar a extensão para UUIDs se necessário
create extension if not exists "uuid-ossp";

-- Criação da tabela de Perfis de Usuário (Tenants)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    
    -- O 'role' define o nível de permissão ('superadmin', 'admin', 'employee')
    role text default 'admin' check (role in ('superadmin', 'admin', 'employee')),
    
    -- O 'business_type' é definido pelo Super Admin ('oficina', 'restaurante', 'loja')
    business_type text null,
    
    -- Status da conta: aguardando aprovação, ativa ou bloqueada
    status text default 'pending' check (status in ('pending', 'approved', 'blocked')),
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar segurança em nível de linha (RLS)
alter table public.profiles enable row level security;

-- Política de RLS:
-- 1. Qualquer usuário autenticado pode ver o seu próprio perfil
create policy "Usuários podem ver o próprio perfil." 
    on public.profiles for select 
    using ( auth.uid() = id );

-- 2. Qualquer um pode inserir seu perfil durante o Cadastro/Trigger
create policy "Qualquer um pode inserir." 
    on public.profiles for insert 
    with check ( auth.uid() = id );

-- 3. O usuário pode atualizar o próprio nome, mas NÃO seu status ou role
create policy "Usuários podem atualizar próprios dados (exceto role/status)." 
    on public.profiles for update 
    using ( auth.uid() = id );

-- Função Trigger para criar o profile automaticamente ao se cadastrar no Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin', 'pending');
  return new;
end;
$$ language plpgsql security definer;

-- Associando a Trigger ao evento de insert do Auth Supabase
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANTE: Para você ser o Super Admin e ver os clientes:
-- Mais políticas serão criadas usando uma Role "superadmin"
-- Na Dashboard, você como SuperAdmin atualizará manual o 'business_type' e o 'status' para 'approved'.
