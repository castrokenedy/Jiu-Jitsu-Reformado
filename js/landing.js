<<<<<<< HEAD
import {
  loginByUsername,
  syncProfessorAuthUserByEmail,
  listPublicData,
  createInscricao,
  uploadLandingFoto
} from './api.js';

let alunos = [];
let metas = [];
let config = [];

const FC = { branca: { bg: 'white', txt: '#333' }, azul: { bg: '#2563eb', txt: 'white' }, roxa: { bg: '#7c3aed', txt: 'white' }, marrom: { bg: '#92400e', txt: 'white' }, preta: { bg: '#111', txt: 'white' } };
const FL = { branca: 'Branca', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta' };

function ini(name) { return name.split(' ').slice(0, 2).map((n) => n[0] || '').join('').toUpperCase(); }
function cleanTel(tel) { return (tel || '').replace(/\D/g, ''); }
function waLink(tel) { const n = cleanTel(tel); return `https://wa.me/55${n}`; }
function toast(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2800); }
function avatarEl(a, size) { const s = size || 36; return a.foto ? `<div class="avatar" style="width:${s}px;height:${s}px;"><img src="${a.foto}" alt="${a.nome}"></div>` : `<div class="avatar" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .3)}px;">${ini(a.nome)}</div>`; }

window.scrollTo2 = function scrollTo2(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
window.openLogin = function openLogin() { document.getElementById('login-overlay').classList.add('open'); };
window.closeLogin = function closeLogin() { document.getElementById('login-overlay').classList.remove('open'); };

window.doLogin = async function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');
  try {
    const { session, professor } = await loginByUsername(u, p);
    await syncProfessorAuthUserByEmail(session.user.id, session.user.email);
    err.style.display = 'none';
    window.location.href = './painel.html';
  } catch (e) {
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 2500);
  }
};

window.handleLandingFoto = async function handleLandingFoto(e) {
  const file = e.target.files[0]; if (!file) return;
  try {
    const url = await uploadLandingFoto(file);
    const img = document.getElementById('foto-projeto');
    const ph = document.getElementById('foto-placeholder');
    img.src = url; img.style.display = 'block';
    if (ph) ph.style.display = 'none';
    toast('📸 Foto da landing page atualizada!');
  } catch (err) {
    toast(`❌ ${err.message || 'Erro no upload da foto'}`);
  }
};

window.enviarInscricao = async function enviarInscricao() {
  const nome = document.getElementById('fi-nome').value.trim();
  const tel = document.getElementById('fi-tel').value.trim();
  if (!nome || !tel) { toast('❌ Preencha nome e WhatsApp'); return; }

  try {
    await createInscricao({
      nome,
      idade: parseInt(document.getElementById('fi-idade').value) || null,
      tel,
      dia: document.getElementById('fi-dia').value || 'A definir',
      exp: document.getElementById('fi-exp').value || 'Não informado',
      como: document.getElementById('fi-como').value || null,
      obs: document.getElementById('fi-obs').value || null,
      status: 'pendente'
    });
    document.getElementById('ins-form').style.display = 'none';
    document.getElementById('ins-ok').style.display = 'block';
    toast(`🎉 Inscrição de ${nome} recebida!`);
  } catch (err) {
    toast(`❌ ${err.message || 'Erro ao enviar inscrição'}`);
  }
};

function renderRankingPub() {
  const el = document.getElementById('ranking-pub-grid');
  if (!el) return;
  const sorted = [...alunos].sort((a, b) => (b.pontos || 0) - (a.pontos || 0)).slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = sorted.map((a, i) => {
    return `<div class="pts-pub-card">
      <div class="pts-pub-pos ${i < 3 ? 'gold' : ''}">${medals[i] || `#${i + 1}`}</div>
      ${avatarEl(a, 44)}
      <div class="pts-pub-pts" style="margin-top:.5rem;">${a.pontos || 0}</div>
      <div class="pts-pub-nome">${(a.nome || '').split(' ')[0]}</div>
      <div class="pts-pub-faixa">${FL[a.faixa] || '-'}</div>
    </div>`;
  }).join('');
}

function renderMetasPub() {
  const el = document.getElementById('metas-pub');
  if (!el) return;
  el.innerHTML = metas.map((m) => {
    const isN = m.tipo === 'cestas';
    const cur = isN ? (m.atualn || 0) : (m.atual || 0);
    const tot = isN ? (m.metan || 0) : (m.meta || 0);
    const p = tot > 0 ? Math.min(100, Math.round((cur / tot) * 100)) : 0;
    const valStr = isN ? `${cur} cestas` : `R$ ${Number(cur).toLocaleString('pt-BR')}`;
    const metStr = isN ? `meta: ${tot} cestas` : `meta: R$ ${Number(tot).toLocaleString('pt-BR')}`;
    return `<div class="meta-card"><div class="meta-header"><div><div class="meta-title">${m.titulo}</div><div class="meta-detail">${m.detalhe || ''}</div></div><div class="meta-valor">${valStr}<br><span class="meta-percentual">${metStr}</span></div></div><div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div><div style="display:flex;justify-content:space-between;"><span class="meta-detail">${p}% alcançado</span><span class="meta-detail">${isN ? `Faltam ${tot - cur} cestas` : `Faltam R$ ${Number(tot - cur).toLocaleString('pt-BR')}`}</span></div></div>`;
  }).join('');
}

async function init() {
  try {
    const data = await listPublicData();
    alunos = data.alunos;
    metas = data.metas;
    config = data.config;

    const foto = config.find((c) => c.chave === 'landing_foto_url')?.valor;
    if (foto) {
      const img = document.getElementById('foto-projeto');
      const ph = document.getElementById('foto-placeholder');
      img.src = foto;
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
    }

    renderMetasPub();
    renderRankingPub();
  } catch (e) {
    toast(`❌ ${e.message || 'Erro ao carregar dados públicos'}`);
  }
=======
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
>>>>>>> aae21a11f226edf893d90d536ef21b5675eb3146
}

init();
