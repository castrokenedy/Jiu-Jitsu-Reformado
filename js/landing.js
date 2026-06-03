import { loginWithEmail, getSession } from './auth.js';
import { listarRanking } from './alunos.js';
import { criarInscricao, listarMetas, listarConfiguracoes } from './data.js';
import { BELT_LABELS } from './supabase-config.js';
import { toast, qs, escapeHtml } from './utils.js';

function openModal() {
  qs('login-modal').classList.add('open');
}

function closeModal() {
  qs('login-modal').classList.remove('open');
}

async function handleLogin(event) {
  event.preventDefault();
  try {
    const email = qs('login-email').value.trim();
    const password = qs('login-password').value;
    await loginWithEmail(email, password);
    window.location.href = './painel.html';
  } catch (error) {
    toast(error.message || 'Falha no login', 'error');
  }
}

async function handleInscricao(event) {
  event.preventDefault();
  try {
    await criarInscricao({
      nome: qs('fi-nome').value.trim(),
      idade: Number(qs('fi-idade').value || 0),
      whatsapp: qs('fi-tel').value.trim(),
      dia_preferido: qs('fi-dia').value || null,
      experiencia: qs('fi-exp').value || null,
      como_conheceu: qs('fi-como').value || null,
      observacoes: qs('fi-obs').value || null,
      status: 'pendente'
    });

    qs('form-inscricao').reset();
    qs('ins-ok').classList.remove('hidden');
    toast('Inscrição enviada com sucesso!');
  } catch (error) {
    toast(error.message || 'Não foi possível enviar inscrição', 'error');
  }
}

async function carregarPublico() {
  try {
    const [ranking, metas, config] = await Promise.all([listarRanking(10), listarMetas(), listarConfiguracoes()]);

    qs('ranking-publico').innerHTML = ranking
      .map((a, i) => `
        <div class="rank-card">
          <div>#${i + 1}</div>
          <strong>${escapeHtml(a.nome)}</strong>
          <span>${a.pontos_total || 0} pts · ${BELT_LABELS[a.faixa] || '-'}</span>
        </div>
      `)
      .join('');

    qs('metas-publicas').innerHTML = metas
      .map((m) => {
        const pct = m.meta_valor > 0 ? Math.round((m.atual_valor / m.meta_valor) * 100) : 0;
        return `
          <div class="meta-card">
            <div>
              <strong>${escapeHtml(m.titulo)}</strong>
              <small>${escapeHtml(m.detalhe || '')}</small>
            </div>
            <div>${pct}%</div>
          </div>
        `;
      })
      .join('');

    const foto = config.find((c) => c.chave === 'landing_foto_url')?.valor;
    if (foto) qs('landing-foto').src = foto;
  } catch (error) {
    toast('Erro ao carregar dados públicos', 'error');
  }
}

async function init() {
  const session = await getSession();
  if (session) {
    qs('go-panel').classList.remove('hidden');
  }

  qs('btn-open-login').addEventListener('click', openModal);
  qs('btn-close-login').addEventListener('click', closeModal);
  qs('form-login').addEventListener('submit', handleLogin);
  qs('form-inscricao').addEventListener('submit', handleInscricao);

  if (qs('go-panel')) {
    qs('go-panel').addEventListener('click', () => {
      window.location.href = './painel.html';
    });
  }

  carregarPublico();
}

init();
