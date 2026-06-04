create extension if not exists pgcrypto;

create table if not exists public.professores (
  id bigserial primary key,
  auth_user_id uuid unique,
  nome text not null,
  user_login text unique not null,
  email text unique,
  nivel text not null default 'assist' check (nivel in ('admin','prof','assist')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alunos (
  id bigserial primary key,
  nome text not null,
  tel text,
  idade int,
  nasc date,
  faixa text not null default 'branca' check (faixa in ('branca','azul','roxa','marrom','preta')),
  grau int not null default 0 check (grau between 0 and 4),
  pontos int not null default 0,
  presencas int not null default 0,
  faltas int not null default 0,
  obs text,
  foto text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devocionais (
  id bigserial primary key,
  dia text not null check (dia in ('seg','qui')),
  data date not null,
  aluno text not null,
  aluno_id bigint references public.alunos(id) on delete set null,
  passagem text,
  created_at timestamptz not null default now()
);

create table if not exists public.campeonatos (
  id bigserial primary key,
  aluno text not null,
  aluno_id bigint references public.alunos(id) on delete set null,
  camp text not null,
  res text not null,
  pts int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cestas (
  id bigserial primary key,
  aluno text not null,
  aluno_id bigint references public.alunos(id) on delete set null,
  tipo text not null check (tipo in ('kg','cesta')),
  qtd int not null default 1,
  pts int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recompensas (
  id bigserial primary key,
  aluno text not null,
  aluno_id bigint references public.alunos(id) on delete set null,
  item text not null,
  pts int not null,
  data text,
  created_at timestamptz not null default now()
);

create table if not exists public.metas (
  id bigserial primary key,
  titulo text not null,
  meta numeric(12,2) not null default 0,
  atual numeric(12,2) not null default 0,
  detalhe text,
  tipo text,
  metan int,
  atualn int,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inscricoes (
  id bigserial primary key,
  nome text not null,
  idade int,
  tel text not null,
  dia text,
  exp text,
  como text,
  obs text,
  status text not null default 'pendente' check (status in ('pendente','convertida','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eventos (
  id bigserial primary key,
  titulo text not null,
  data date not null,
  tipo text not null check (tipo in ('aula','evento','camp')),
  created_at timestamptz not null default now()
);

create table if not exists public.presenca_log (
  id bigserial primary key,
  data date not null,
  dia text not null,
  aluno_id bigint,
  nome text not null,
  presente boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.configuracoes (
  chave text primary key,
  valor text,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_prof_upd on public.professores;
create trigger trg_prof_upd before update on public.professores for each row execute function public.set_updated_at();

drop trigger if exists trg_alunos_upd on public.alunos;
create trigger trg_alunos_upd before update on public.alunos for each row execute function public.set_updated_at();

drop trigger if exists trg_metas_upd on public.metas;
create trigger trg_metas_upd before update on public.metas for each row execute function public.set_updated_at();

drop trigger if exists trg_insc_upd on public.inscricoes;
create trigger trg_insc_upd before update on public.inscricoes for each row execute function public.set_updated_at();

alter table public.professores enable row level security;
alter table public.alunos enable row level security;
alter table public.devocionais enable row level security;
alter table public.campeonatos enable row level security;
alter table public.cestas enable row level security;
alter table public.recompensas enable row level security;
alter table public.metas enable row level security;
alter table public.inscricoes enable row level security;
alter table public.eventos enable row level security;
alter table public.presenca_log enable row level security;
alter table public.configuracoes enable row level security;

create or replace function public.is_professor()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.professores p
    where p.auth_user_id = auth.uid()
      and p.ativo = true
  );
$$;

-- políticas professores (anônimo pode ler para buscar email por user_login no login)
drop policy if exists public_prof_login on public.professores;
create policy public_prof_login on public.professores for select using (true);
drop policy if exists prof_all_prof on public.professores;
create policy prof_all_prof on public.professores for all using (public.is_professor()) with check (public.is_professor());

-- políticas professor nas tabelas internas
drop policy if exists prof_all_alunos on public.alunos;
create policy prof_all_alunos on public.alunos for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_devocionais on public.devocionais;
create policy prof_all_devocionais on public.devocionais for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_campeonatos on public.campeonatos;
create policy prof_all_campeonatos on public.campeonatos for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_cestas on public.cestas;
create policy prof_all_cestas on public.cestas for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_recompensas on public.recompensas;
create policy prof_all_recompensas on public.recompensas for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_metas on public.metas;
create policy prof_all_metas on public.metas for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_eventos on public.eventos;
create policy prof_all_eventos on public.eventos for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_presenca_log on public.presenca_log;
create policy prof_all_presenca_log on public.presenca_log for all using (public.is_professor()) with check (public.is_professor());

drop policy if exists prof_all_config on public.configuracoes;
create policy prof_all_config on public.configuracoes for all using (public.is_professor()) with check (public.is_professor());

-- inscrição pública
drop policy if exists public_insert_insc on public.inscricoes;
create policy public_insert_insc on public.inscricoes for insert with check (true);
drop policy if exists prof_manage_insc on public.inscricoes;
create policy prof_manage_insc on public.inscricoes for all using (public.is_professor()) with check (public.is_professor());

-- leitura pública landing
drop policy if exists public_read_alunos on public.alunos;
create policy public_read_alunos on public.alunos for select using (ativo = true);
drop policy if exists public_read_metas on public.metas;
create policy public_read_metas on public.metas for select using (true);
drop policy if exists public_read_cfg on public.configuracoes;
create policy public_read_cfg on public.configuracoes for select using (true);

insert into storage.buckets (id, name, public)
values ('alunos-fotos', 'alunos-fotos', true)
on conflict (id) do nothing;

drop policy if exists public_read_alunos_fotos on storage.objects;
create policy public_read_alunos_fotos on storage.objects for select using (bucket_id = 'alunos-fotos');

drop policy if exists prof_insert_alunos_fotos on storage.objects;
create policy prof_insert_alunos_fotos on storage.objects for insert with check (bucket_id = 'alunos-fotos' and public.is_professor());

drop policy if exists prof_update_alunos_fotos on storage.objects;
create policy prof_update_alunos_fotos on storage.objects for update using (bucket_id = 'alunos-fotos' and public.is_professor()) with check (bucket_id = 'alunos-fotos' and public.is_professor());

drop policy if exists prof_delete_alunos_fotos on storage.objects;
create policy prof_delete_alunos_fotos on storage.objects for delete using (bucket_id = 'alunos-fotos' and public.is_professor());

-- exemplo: vincular professor ao usuário auth
-- insert into public.professores (auth_user_id,nome,user_login,email,nivel)
-- values ('UUID_AUTH_USER','Professor Admin','professor','email@dominio.com','admin');
