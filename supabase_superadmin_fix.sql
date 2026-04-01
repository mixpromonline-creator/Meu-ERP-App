-- Run this script in the Supabase SQL Editor for existing projects.
-- It enables superadmins to list and update all profiles.

alter table public.profiles enable row level security;

drop policy if exists "Usuarios podem ver o proprio perfil." on public.profiles;
drop policy if exists "Usuarios podem inserir o proprio perfil." on public.profiles;
drop policy if exists "Usuarios podem atualizar o proprio perfil." on public.profiles;
drop policy if exists "Superadmins podem ver todos os perfis." on public.profiles;
drop policy if exists "Superadmins podem atualizar todos os perfis." on public.profiles;
drop policy if exists "Usuários podem ver o próprio perfil." on public.profiles;
drop policy if exists "Qualquer um pode inserir." on public.profiles;
drop policy if exists "Usuários podem atualizar próprios dados (exceto role/status)." on public.profiles;

create or replace function public.is_superadmin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'superadmin'
  );
$$;

create policy "Usuarios podem ver o proprio perfil."
    on public.profiles for select
    using (auth.uid() = id);

create policy "Superadmins podem ver todos os perfis."
    on public.profiles for select
    using (public.is_superadmin(auth.uid()));

create policy "Usuarios podem inserir o proprio perfil."
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Usuarios podem atualizar o proprio perfil."
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Superadmins podem atualizar todos os perfis."
    on public.profiles for update
    using (public.is_superadmin(auth.uid()))
    with check (public.is_superadmin(auth.uid()));
