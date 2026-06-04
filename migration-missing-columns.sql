-- Adicionar colunas faltantes na tabela alunos
alter table public.alunos
add column if not exists pontos int not null default 0,
add column if not exists presencas int not null default 0,
add column if not exists faltas int not null default 0,
add column if not exists foto text,
add column if not exists idade int,
add column if not exists nasc date,
add column if not exists faixa text not null default 'branca',
add column if not exists grau int not null default 0,
add column if not exists obs text;

-- Adicionar colunas faltantes na tabela professores
alter table public.professores
add column if not exists user_login text unique,
add column if not exists email text unique;

-- Adicionar colunas faltantes na tabela devocionais
alter table public.devocionais
add column if not exists data date,
add column if not exists dia text,
add column if not exists aluno text,
add column if not exists aluno_id bigint references public.alunos(id) on delete set null,
add column if not exists passagem text;

-- Adicionar colunas faltantes na tabela eventos
alter table public.eventos
add column if not exists data date,
add column if not exists tipo text;

-- Adicionar colunas faltantes na tabela campeonatos
alter table public.campeonatos
add column if not exists aluno text,
add column if not exists aluno_id bigint references public.alunos(id) on delete set null,
add column if not exists camp text,
add column if not exists res text,
add column if not exists pts int;

-- Adicionar colunas faltantes na tabela cestas
alter table public.cestas
add column if not exists aluno text,
add column if not exists aluno_id bigint references public.alunos(id) on delete set null,
add column if not exists tipo text,
add column if not exists qtd int,
add column if not exists pts int;

-- Adicionar colunas faltantes na tabela recompensas
alter table public.recompensas
add column if not exists aluno text,
add column if not exists aluno_id bigint references public.alunos(id) on delete set null,
add column if not exists item text,
add column if not exists pts int,
add column if not exists data text;

-- Adicionar colunas faltantes na tabela inscricoes
alter table public.inscricoes
add column if not exists nome text,
add column if not exists idade int,
add column if not exists tel text,
add column if not exists dia text,
add column if not exists exp text,
add column if not exists como text,
add column if not exists obs text,
add column if not exists status text not null default 'pendente';

-- Adicionar colunas faltantes na tabela metas
alter table public.metas
add column if not exists titulo text,
add column if not exists meta numeric(12,2),
add column if not exists atual numeric(12,2),
add column if not exists detalhe text,
add column if not exists tipo text,
add column if not exists metan int,
add column if not exists atualn int,
add column if not exists ordem int default 0;

-- Adicionar colunas faltantes na tabela presenca_log
alter table public.presenca_log
add column if not exists data date,
add column if not exists dia text,
add column if not exists aluno_id bigint,
add column if not exists nome text,
add column if not exists presente boolean not null default false;

-- Adicionar colunas faltantes na tabela configuracoes
alter table public.configuracoes
add column if not exists chave text primary key,
add column if not exists valor text;
