<<<<<<< HEAD
create extension if not exists pgcrypto;

create table if not exists public.professores (
  id bigserial primary key,
  auth_user_id uuid unique,
  nome text not null,
  user_login text unique not null,
  email text unique,
=======
-- ============================================================
-- SETUP COMPLETO - SISTEMA JIU-JITSU REFORMADO (SUPABASE)
-- Execute no SQL Editor do Supabase
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- TABELAS
-- ============================================================

create table if not exists public.professores (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
  nivel text not null default 'assist' check (nivel in ('admin','prof','assist')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alunos (
<<<<<<< HEAD
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
=======
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  idade int,
  data_nascimento date,
  faixa text not null default 'branca' check (faixa in ('branca','azul','roxa','marrom','preta')),
  grau int not null default 0 check (grau between 0 and 4),
  observacoes text,
  foto_url text,
  ativo boolean not null default true,
  presencas int not null default 0,
  faltas int not null default 0,
  pontos_total int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.presencas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  data_aula date not null,
  tipo_aula text not null check (tipo_aula in ('seg','qui','extra')),
  presente boolean not null default false,
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now(),
  unique (aluno_id, data_aula, tipo_aula)
);

create table if not exists public.devocionais (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  data_devocional date not null,
  dia_semana text not null check (dia_semana in ('seg','qui')),
  passagem text,
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now()
);

create table if not exists public.campeonatos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  nome_evento text not null,
  data_evento date not null,
  resultado text not null check (resultado in ('participou','podio','campeao')),
  pontos_recebidos int not null default 0,
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cestas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  tipo text not null check (tipo in ('kg','cesta')),
  quantidade int not null default 1,
  pontos_recebidos int not null default 0,
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now()
);

create table if not exists public.recompensas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  item text not null,
  pontos_custo int not null,
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now()
);

create table if not exists public.pontuacoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  tipo text not null,
  descricao text,
  pontos int not null,
  data_evento date not null default current_date,
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now()
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data_evento date not null,
  tipo text not null check (tipo in ('aula','evento','camp')),
  created_by uuid references public.professores(id),
  created_at timestamptz not null default now()
);

create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalhe text,
  atual_valor numeric(12,2) not null default 0,
  meta_valor numeric(12,2) not null default 0,
  ordem int not null default 0,
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

<<<<<<< HEAD
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
=======
create table if not exists public.inscricoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  idade int,
  whatsapp text not null,
  dia_preferido text,
  experiencia text,
  como_conheceu text,
  observacoes text,
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
  status text not null default 'pendente' check (status in ('pendente','convertida','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

<<<<<<< HEAD
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

=======
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
create table if not exists public.configuracoes (
  chave text primary key,
  valor text,
  updated_at timestamptz not null default now()
);

<<<<<<< HEAD
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
=======
-- ============================================================
-- FUNÇÕES/TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
begin
  new.updated_at = now();
  return new;
end;
$$;

<<<<<<< HEAD
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
=======
create or replace function public.refresh_aluno_totais(p_aluno_id uuid)
returns void
language plpgsql
as $$
declare
  v_pontos int;
  v_presencas int;
  v_faltas int;
begin
  select coalesce(sum(p.pontos),0) into v_pontos
  from public.pontuacoes p
  where p.aluno_id = p_aluno_id;

  select
    count(*) filter (where pr.presente = true),
    count(*) filter (where pr.presente = false)
  into v_presencas, v_faltas
  from public.presencas pr
  where pr.aluno_id = p_aluno_id;

  update public.alunos
  set pontos_total = coalesce(v_pontos,0),
      presencas = coalesce(v_presencas,0),
      faltas = coalesce(v_faltas,0),
      updated_at = now()
  where id = p_aluno_id;
end;
$$;

create or replace function public.on_pontuacao_change()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_aluno_totais(coalesce(new.aluno_id, old.aluno_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.on_presenca_change()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_aluno_totais(coalesce(new.aluno_id, old.aluno_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_alunos_updated_at on public.alunos;
create trigger trg_alunos_updated_at
before update on public.alunos
for each row execute function public.set_updated_at();

drop trigger if exists trg_professores_updated_at on public.professores;
create trigger trg_professores_updated_at
before update on public.professores
for each row execute function public.set_updated_at();

drop trigger if exists trg_metas_updated_at on public.metas;
create trigger trg_metas_updated_at
before update on public.metas
for each row execute function public.set_updated_at();

drop trigger if exists trg_inscricoes_updated_at on public.inscricoes;
create trigger trg_inscricoes_updated_at
before update on public.inscricoes
for each row execute function public.set_updated_at();

drop trigger if exists trg_pontuacao_refresh on public.pontuacoes;
create trigger trg_pontuacao_refresh
after insert or update or delete on public.pontuacoes
for each row execute function public.on_pontuacao_change();

drop trigger if exists trg_presenca_refresh on public.presencas;
create trigger trg_presenca_refresh
after insert or update or delete on public.presencas
for each row execute function public.on_presenca_change();

-- ============================================================
-- RLS
-- ============================================================

alter table public.professores enable row level security;
alter table public.alunos enable row level security;
alter table public.presencas enable row level security;
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
alter table public.devocionais enable row level security;
alter table public.campeonatos enable row level security;
alter table public.cestas enable row level security;
alter table public.recompensas enable row level security;
<<<<<<< HEAD
alter table public.metas enable row level security;
alter table public.inscricoes enable row level security;
alter table public.eventos enable row level security;
alter table public.presenca_log enable row level security;
alter table public.configuracoes enable row level security;

create or replace function public.is_professor()
returns boolean language sql stable as $$
=======
alter table public.pontuacoes enable row level security;
alter table public.eventos enable row level security;
alter table public.metas enable row level security;
alter table public.inscricoes enable row level security;
alter table public.configuracoes enable row level security;

create or replace function public.is_professor()
returns boolean
language sql
stable
as $$
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
  select exists (
    select 1 from public.professores p
    where p.auth_user_id = auth.uid()
      and p.ativo = true
  );
$$;

<<<<<<< HEAD
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
=======
-- Professores podem tudo nas tabelas internas
create policy if not exists prof_all_professores on public.professores for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_alunos on public.alunos for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_presencas on public.presencas for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_devocionais on public.devocionais for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_campeonatos on public.campeonatos for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_cestas on public.cestas for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_recompensas on public.recompensas for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_pontuacoes on public.pontuacoes for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_eventos on public.eventos for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_metas on public.metas for all using (public.is_professor()) with check (public.is_professor());
create policy if not exists prof_all_config on public.configuracoes for all using (public.is_professor()) with check (public.is_professor());

-- Público: leitura de ranking/metas/config para landing + criação inscrição
create policy if not exists public_read_alunos on public.alunos
for select using (ativo = true);

create policy if not exists public_read_metas on public.metas
for select using (ativo = true);

create policy if not exists public_read_config on public.configuracoes
for select using (true);

create policy if not exists public_insert_inscricoes on public.inscricoes
for insert with check (true);

create policy if not exists prof_manage_inscricoes on public.inscricoes
for all using (public.is_professor()) with check (public.is_professor());

-- ============================================================
-- STORAGE BUCKET: alunos-fotos
-- ============================================================
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146

insert into storage.buckets (id, name, public)
values ('alunos-fotos', 'alunos-fotos', true)
on conflict (id) do nothing;

<<<<<<< HEAD
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
=======
-- leitura pública das fotos
create policy if not exists public_read_alunos_fotos
on storage.objects for select
using (bucket_id = 'alunos-fotos');

-- somente professor autenticado pode enviar/remover/editar
create policy if not exists prof_insert_alunos_fotos
on storage.objects for insert
with check (bucket_id = 'alunos-fotos' and public.is_professor());

create policy if not exists prof_update_alunos_fotos
on storage.objects for update
using (bucket_id = 'alunos-fotos' and public.is_professor())
with check (bucket_id = 'alunos-fotos' and public.is_professor());

create policy if not exists prof_delete_alunos_fotos
on storage.objects for delete
using (bucket_id = 'alunos-fotos' and public.is_professor());

-- ============================================================
-- EXEMPLO: CADASTRAR PRIMEIRO PROFESSOR
-- (depois de criar usuário em Authentication > Users)
-- ============================================================
-- insert into public.professores (auth_user_id, nome, email, nivel)
-- values ('UUID_DO_USUARIO_AUTH', 'Nome do Professor', 'email@exemplo.com', 'admin');
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
