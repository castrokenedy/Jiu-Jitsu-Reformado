# sistema_alunos_v2 (fiel ao index_base.html)

Este diretório recria o layout e a lógica do `index_base.html` original, mantendo visual/UX e substituindo persistência para Supabase:

- Login hardcoded ➜ **Supabase Auth**
- Dados em memória/local ➜ **Supabase PostgreSQL**
- Fotos base64 ➜ **Supabase Storage** (`alunos-fotos`)

## Estrutura

- `index.html` — landing + login (visual original)
- `painel.html` — painel completo com abas (visual original)
- `css/styles.css` — estilos originais extraídos
- `js/supabase-config.js` — conexão Supabase
- `js/api.js` — camada de acesso a dados/auth/storage
- `js/landing.js` — comportamento da landing
- `js/painel.js` — comportamento do painel
- `setup.sql` — schema + RLS + policies + bucket

## Setup Supabase

1. No Supabase SQL Editor, execute `setup.sql`.
2. Em Authentication > Users, crie um usuário (email/senha) para login.
3. Vincule esse usuário na tabela `professores`:

```sql
insert into public.professores (auth_user_id, nome, user_login, email, nivel)
values ('UUID_DO_AUTH_USER', 'Professor Admin', 'professor', 'seu-email@dominio.com', 'admin');
```

> O campo `user_login` é o que você digita no campo “Usuário” da tela de login.

## Rodando localmente

```bash
cd /home/ubuntu/sistema_alunos_v2
python3 -m http.server 3000
```

Abra:

- `http://localhost:3000/index.html`
- `http://localhost:3000/painel.html`

## Observações

- O visual foi mantido a partir do arquivo original.
- A persistência e autenticação agora dependem do Supabase.
- Algumas operações de gestão de professores exigem ajuste de e-mails e vínculo com `auth.users` para login real de novos professores.
