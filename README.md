# Sistema de Alunos · Jiu-Jitsu Reformado (Supabase)

Migração do `index_base.html` para uma arquitetura moderna, modular e segura com Supabase.

## Funcionalidades implementadas

- Autenticação real de professores (Supabase Auth / email+senha)
- Landing pública com:
  - ranking de pontuação
  - metas do projeto
  - formulário de inscrição
- Painel do professor com:
  - dashboard
  - cadastro/edição/exclusão de alunos
  - upload de fotos para Supabase Storage (`alunos-fotos`)
  - presença e relatório
  - devocionais
  - campeonatos
  - pontuação manual
  - cestas/alimentos
  - recompensas
  - metas
  - inscrições pendentes (conversão para aluno)
  - gestão de professores
  - calendário/eventos
  - configurações (foto da landing)
- Row Level Security (RLS)

## Estrutura do projeto

```txt
sistema_alunos/
  index.html
  painel.html
  setup.sql
  README.md
  css/
    main.css
  js/
    supabase-config.js
    auth.js
    alunos.js
    presenca.js
    devocionais.js
    campeonatos.js
    data.js
    landing.js
    painel.js
    utils.js
```

## 1) Setup do Supabase

1. Crie um projeto no Supabase.
2. Vá em **Project Settings > API** e copie:
   - Project URL
   - anon public key
3. Atualize o arquivo `js/supabase-config.js` se necessário.

## 2) Executar SQL

1. Abra **SQL Editor** no Supabase.
2. Cole e execute todo o conteúdo de `setup.sql`.
3. Verifique se as tabelas e políticas foram criadas.

## 3) Criar usuário professor

1. Em **Authentication > Users**, crie um usuário com email/senha.
2. Copie o `id` (UUID) desse usuário.
3. Insira um registro na tabela `professores`:

```sql
insert into public.professores (auth_user_id, nome, email, nivel)
values ('UUID_DO_AUTH_USERS', 'Professor Admin', 'admin@igreja.com', 'admin');
```

## 4) Storage bucket

O `setup.sql` já cria o bucket `alunos-fotos` e políticas de acesso.

## 5) Como rodar localmente

Você pode abrir com servidor estático simples.

Exemplo com Python:

```bash
cd /home/ubuntu/sistema_alunos
python3 -m http.server 3000
```

Depois abra:

- `http://localhost:3000/index.html`
- `http://localhost:3000/painel.html`

## 6) Fluxo de uso

1. Acesse `index.html` (landing).
2. Faça login com email/senha do professor.
3. Será redirecionado para `painel.html`.
4. Use o menu lateral para operar todas as funcionalidades.

## Observações de segurança

- Não há credenciais hardcoded de usuário/senha no frontend.
- Dados críticos são protegidos por RLS.
- Upload de fotos vai para Supabase Storage (não base64 local).
- Operações do painel dependem de usuário autenticado + perfil na tabela `professores`.
