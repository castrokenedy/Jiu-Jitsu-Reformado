import {
  getSession,
  getProfessorProfileBySession,
  logout as apiLogout,
  listPainelData,
  createAluno,
  updateAluno,
  deactivateAluno,
  createDevocional,
  createCampeonato,
  createCesta,
  createRecompensa,
  createEvento,
  saveMeta,
  createProfessorWithAuth,
  removeProfessor,
  updateInscricaoStatus,
  insertPresencaLogs,
  uploadAlunoFoto,
  uploadLandingFoto,
  saveConfig
} from './api.js';

function showFatalError(message) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f172a;color:#f8fafc;">
      <div style="max-width:640px;text-align:center;border:1px solid rgba(255,255,255,.08);padding:28px 32px;border-radius:18px;background:rgba(15,23,42,.95);box-shadow:0 18px 50px rgba(0,0,0,.35);">
        <div style="font-size:2rem;margin-bottom:16px;">⚠️ Erro ao carregar o painel</div>
        <div style="font-size:1rem;line-height:1.6;color:#e2e8f0;">${message}</div>
        <button onclick="window.location.href='./index.html'" style="margin-top:24px;padding:12px 20px;border:none;border-radius:10px;background:#2563eb;color:white;font-weight:700;cursor:pointer;">Voltar à landing</button>
      </div>
    </div>`;
}

  // MOSTRAR O APP (painel)
  const appDiv = document.getElementById('app');
  if (appDiv) appDiv.style.display = 'block';
  console.log('✅ APP visível');

window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error || event.message);
  showFatalError((event.error && event.error.message) || event.message || 'Erro desconhecido');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  showFatalError((event.reason && event.reason.message) || String(event.reason) || 'Erro desconhecido');
});

// ==== STATE ====
let alunos = [];
let devocionais = [];
let campeonatos = [];
let cestas = [];
let inscricoes = [];
let recompensas = [];
let metas = [];
let professores = [];
let eventos = [];
let presencaLog = [];
let config = [];
let editingId = null;
let presencaState = {};
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let currentProfile = null;

// ==== HELPERS ====
const FC = { branca: { bg: 'white', txt: '#333' }, azul: { bg: '#2563eb', txt: 'white' }, roxa: { bg: '#7c3aed', txt: 'white' }, marrom: { bg: '#92400e', txt: 'white' }, preta: { bg: '#111', txt: 'white' } };
const FL = { branca: 'Branca', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta' };
function ini(name) { return (name || '').split(' ').slice(0, 2).map((n) => n[0] || '').join('').toUpperCase(); }
function fmtDate(s) { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}`; }
function fmtDateFull(s) { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; }
function today() { return new Date().toISOString().split('T')[0]; }
function toast(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2800); }
function pct(a) { const t = (a.presencas || 0) + (a.faltas || 0); return t > 0 ? Math.round(((a.presencas || 0) / t) * 100) : 0; }
function faixaBadge(faixa, grau) { const c = FC[faixa] || FC.branca; const g = grau > 0 ? '|'.repeat(grau) : ''; return `<span class="badge-faixa" style="background:${c.bg};color:${c.txt};border:1px solid rgba(0,0,0,.15);">${FL[faixa]}${g ? `<span style="color:var(--d);font-size:.6rem;margin-left:3px;">${g}</span>` : ''}</span>`; }
function avatarEl(a, size) { const s = size || 36; return a.foto ? `<div class="avatar" style="width:${s}px;height:${s}px;"><img src="${a.foto}" alt="${a.nome}"></div>` : `<div class="avatar" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .3)}px;">${ini(a.nome)}</div>`; }
function popSel(id) { const s = document.getElementById(id); if (!s) return; s.innerHTML = alunos.map((a) => `<option value="${a.id}">${a.nome}</option>`).join(''); }
function popAllSels() { ['pt-aluno', 'dv-aluno', 'camp-aluno', 'cesta-aluno', 'rec-aluno', 'rel-aluno'].forEach(popSel); }
function cleanTel(tel) { return (tel || '').replace(/\D/g, ''); }
function waLink(tel) { const n = cleanTel(tel); return `https://wa.me/55${n}`; }

async function refreshData() {
  console.log('🔄 Iniciando refreshData...');
  try {
    const data = await listPainelData();
    console.log('📦 Dados carregados:', data);
    alunos = data.alunos || [];
    devocionais = data.devocionais || [];
    campeonatos = data.campeonatos || [];
    cestas = data.cestas || [];
    inscricoes = data.inscricoes || [];
    recompensas = data.recompensas || [];
    metas = data.metas || [];
    professores = data.professores || [];
    eventos = data.eventos || [];
    presencaLog = data.presencaLog || [];
    config = data.config || [];
    console.log('✅ refreshData completo. Alunos:', alunos.length);
  } catch (e) {
    console.error('❌ Erro em refreshData:', e);
    throw e;
  }
}

function currUserProf() {
  return professores.find((p) => p.auth_user_id === currentProfile?.auth_user_id) || currentProfile;
}

// ==== ANIVERSÁRIOS ====
function checkBdays() {
  const now = new Date();
  const todayMD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
  const bdayAlunos = alunos.filter((a) => {
    if (!a.nasc) return false;
    const parts = a.nasc.split('-');
    const bdayThisYear = new Date(now.getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return bdayThisYear >= now && bdayThisYear <= nextWeek;
  });
  const sec = document.getElementById('bday-section');
  const list = document.getElementById('bday-list');
  if (!sec || !list) return;
  if (bdayAlunos.length > 0) {
    sec.style.display = 'block';
    list.innerHTML = bdayAlunos.map((a) => {
      const parts = a.nasc.split('-');
      const bdayDate = `${parts[2]}/${parts[1]}`;
      const isToday = `${parts[1]}-${parts[2]}` === todayMD;
      return `<div class="bday-alert"><span class="bday-icon">${isToday ? '🎂' : '🎁'}</span><div><div class="bday-name">${a.nome} ${isToday ? '<span style="color:var(--d);font-size:.75rem;">— HOJE!</span>' : ''}</div><div class="bday-date">Aniversário: ${bdayDate} · ${a.idade || '?'} anos · <a href="${waLink(a.tel)}" target="_blank" style="color:#25D366;text-decoration:none;">💬 Parabenizar no WhatsApp</a></div></div></div>`;
    }).join('');
  } else sec.style.display = 'none';
}

// ==== TABS ====
window.showTab = function showTab(name, el) {
  document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach((i) => i.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (el) el.classList.add('active'); else { const found = document.querySelector(`.sidebar-item[data-tab="${name}"]`); if (found) found.classList.add('active'); }
  renderTab(name);
};

function renderTab(n) {
  if (n === 'dashboard') renderDash();
  if (n === 'alunos') renderAlunos();
  if (n === 'ranking') renderRanking();
  if (n === 'presenca') renderChamada();
  if (n === 'relatorio') { popSel('rel-aluno'); const ri = document.getElementById('rel-aluno'); if (ri && !ri.querySelector('option[value=""]')) ri.insertAdjacentHTML('afterbegin', '<option value="">Todos os alunos</option>'); }
  if (n === 'calendario') renderCalendario();
  if (n === 'pontos') popSel('pt-aluno');
  if (n === 'devocional') { popSel('dv-aluno'); renderDevocionais(); }
  if (n === 'campeonatos') { popSel('camp-aluno'); renderCamp(); }
  if (n === 'cestas') { popSel('cesta-aluno'); renderCestas(); }
  if (n === 'recompensas') { popSel('rec-aluno'); renderRecomp(); }
  if (n === 'inscricoes') renderIns();
  if (n === 'metas-adm') renderMetasAdm();
  if (n === 'professores') renderProfs();
  if (n === 'configuracoes') renderConfig();
}

// ==== INIT APP ====
async function initApp() {
  const d = new Date();
  document.getElementById('dash-date').textContent = `Hoje, ${d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`;
  ['pres-data', 'dv-data', 'ev-data'].forEach((id) => { const e = document.getElementById(id); if (e) e.value = today(); });
  const ri = document.getElementById('rel-inicio'); const rf = document.getElementById('rel-fim');
  if (ri) { const d1 = new Date(); d1.setDate(1); ri.value = d1.toISOString().split('T')[0]; }
  if (rf) rf.value = today();
  await refreshData();
  renderDash(); renderAlunos(); popAllSels();
}

// ==== DASHBOARD ====
function renderDash() {
  console.log('🎨 Renderizando Dashboard...');
  try {
    checkBdays();
    const dashDate = document.getElementById('dash-date');
    if (dashDate) dashDate.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    
    const dsTotal = document.getElementById('ds-total');
    if (dsTotal) dsTotal.textContent = alunos.length;
    console.log('✅ ds-total: ' + alunos.length);
    
    const avgFreq = alunos.length ? Math.round(alunos.reduce((s, a) => s + pct(a), 0) / alunos.length) : 0;
    const dsFreq = document.getElementById('ds-freq');
    if (dsFreq) dsFreq.textContent = avgFreq + '%';
    console.log('✅ ds-freq: ' + avgFreq + '%');
    
    const dsIns = document.getElementById('ds-ins');
    if (dsIns) dsIns.textContent = inscricoes.filter((i) => i.status === 'pendente').length;
    
    const totalPts = alunos.reduce((s, a) => s + (a.pontos || 0), 0);
    const dsPts = document.getElementById('ds-pts');
    if (dsPts) dsPts.textContent = totalPts;
    
    const totalCestas = cestas.filter((c) => c.tipo === 'cesta').reduce((s, c) => s + (c.qtd || 0), 0);
    const dsCestas = document.getElementById('ds-cestas');
    if (dsCestas) dsCestas.textContent = totalCestas;

    const dashDevo = document.getElementById('dash-devo');
    if (dashDevo) {
      const prox = devocionais.slice(0, 2);
      dashDevo.innerHTML = prox.length ? prox.map((d) => `<div class="devo-slot"><span class="devo-day">${d.dia === 'seg' ? 'Segunda' : 'Quinta'}</span><div><div class="devo-name">${d.aluno}</div><div class="devo-date">${fmtDate(d.data)} · ${d.passagem || ''}</div></div></div>`).join('') : '<p style="font-size:.85rem;color:rgba(245,240,232,.35);">Nenhum devocional agendado</p>';
    }

    const alertEl = document.getElementById('dash-alertas');
    if (alertEl) {
      const low = alunos.filter((a) => ((a.presencas || 0) + (a.faltas || 0)) > 5 && pct(a) < 65);
      alertEl.innerHTML = low.length ? low.map((a) => `<div style="display:flex;align-items:center;gap:.75rem;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);">${avatarEl(a, 32)}<div style="flex:1;"><div style="font-size:.85rem;font-weight:600;">${a.nome}</div><div style="font-size:.72rem;color:rgba(245,240,232,.38);">${pct(a)}% de frequência · ${a.faltas || 0} faltas</div></div><a href="${waLink(a.tel)}" target="_blank" style="font-size:.72rem;color:#25D366;font-weight:600;text-decoration:none;">💬 WA</a></div>`).join('') : '<p style="font-size:.85rem;color:rgba(245,240,232,.35);">✅ Todos com frequência regular</p>';
    }

    const cards = document.getElementById('dash-cards');
    if (cards) {
      const sorted = [...alunos].sort((a, b) => (b.pontos || 0) - (a.pontos || 0)).slice(0, 12);
      cards.innerHTML = sorted.map((a, i) => {
        const c = FC[a.faixa] || FC.branca;
        return `<div class="aluno-mini" onclick="openModal(${a.id})">${i < 3 ? `<div style="position:absolute;top:8px;right:8px;font-size:.75rem;background:rgba(201,168,76,.15);color:var(--d);border-radius:4px;padding:2px 6px;font-weight:700;">#${i + 1}</div>` : ''}${avatarEl(a, 60)}<div class="am-nome">${(a.nome || '').split(' ')[0]}</div><div class="am-pts">${a.pontos || 0}</div><div class="am-label">pontos</div><div class="faixa-stripe" style="background:${c.bg};border:1px solid rgba(255,255,255,.1);"></div></div>`;
      }).join('');
    }
    console.log('✅ Dashboard renderizado com sucesso');
  } catch (e) {
    console.error('❌ Erro ao renderizar dashboard:', e);
  }
}

function renderRankingPub() {
  const el = document.getElementById('ranking-pub-grid'); if (!el) return;
  const sorted = [...alunos].sort((a, b) => (b.pontos || 0) - (a.pontos || 0)).slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = sorted.map((a, i) => `<div class="pts-pub-card"><div class="pts-pub-pos ${i < 3 ? 'gold' : ''}">${medals[i] || `#${i + 1}`}</div>${avatarEl(a, 44)}<div class="pts-pub-pts" style="margin-top:.5rem;">${a.pontos || 0}</div><div class="pts-pub-nome">${(a.nome || '').split(' ')[0]}</div><div class="pts-pub-faixa">${FL[a.faixa]}</div></div>`).join('');
}

function renderMetasPub() {
  const el = document.getElementById('metas-pub'); if (!el) return;
  el.innerHTML = metas.map((m) => {
    const isN = m.tipo === 'cestas';
    const cur = isN ? (m.metan ?? m.metaN ?? 0) : (m.atual || 0);
    const tot = isN ? (m.metan ?? m.metaN ?? 0) : (m.meta || 0);
    const p = tot > 0 ? Math.min(100, Math.round((cur / tot) * 100)) : 0;
    const valStr = isN ? `${cur} cestas` : `R$ ${Number(cur).toLocaleString('pt-BR')}`;
    const metStr = isN ? `meta: ${tot} cestas` : `meta: R$ ${Number(tot).toLocaleString('pt-BR')}`;
    return `<div class="meta-card"><div class="meta-header"><div><div class="meta-title">${m.titulo}</div><div class="meta-detail">${m.detalhe || ''}</div></div><div class="meta-valor">${valStr}<br><span class="meta-percentual">${metStr}</span></div></div><div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div><div style="display:flex;justify-content:space-between;"><span class="meta-detail">${p}% alcançado</span><span class="meta-detail">${isN ? `Faltam ${tot - cur} cestas` : `Faltam R$ ${Number(tot - cur).toLocaleString('pt-BR')}`}</span></div></div>`;
  }).join('');
}

// ==== ALUNOS ====
function renderAlunos() {
  const tb = document.getElementById('alunos-tb'); if (!tb) return;
  document.getElementById('total-al').textContent = `${alunos.length} alunos`;
  tb.innerHTML = alunos.map((a) => {
    const p2 = pct(a);
    return `<tr><td><div style="display:flex;align-items:center;gap:8px;">${avatarEl(a, 32)}<div><div style="font-weight:600;">${a.nome}</div><div style="font-size:.72rem;color:rgba(245,240,232,.38);">${a.idade || 0} anos${a.nasc ? ` · 🎂 ${fmtDate(a.nasc)}` : ''}</div></div></div></td><td>${faixaBadge(a.faixa, a.grau)}</td><td><span style="font-family:'Barlow Condensed',sans-serif;font-size:1.05rem;font-weight:700;color:var(--d);">${a.pontos || 0}</span></td><td><div style="font-size:.82rem;">${p2}%</div><div style="width:55px;height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:3px;"><div style="width:${p2}%;height:100%;background:${p2 >= 75 ? 'var(--vc)' : p2 >= 50 ? 'var(--d)' : '#ef4444'};border-radius:2px;"></div></div></td><td><a href="${waLink(a.tel)}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;background:#25D366;color:white;padding:4px 10px;border-radius:5px;font-size:.72rem;font-weight:700;text-decoration:none;letter-spacing:.5px;">💬 WhatsApp</a></td><td><button class="btn-sm btn-g" style="font-size:.7rem;padding:6px 10px;" onclick="openModal(${a.id})">✏ Editar</button></td></tr>`;
  }).join('');
}

window.cadastrarAluno = async function cadastrarAluno() {
  const nome = document.getElementById('al-nome').value.trim();
  if (!nome) { toast('❌ Informe o nome'); return; }
  try {
    await createAluno({
      nome,
      tel: document.getElementById('al-tel').value.trim() || '—',
      idade: parseInt(document.getElementById('al-idade').value, 10) || 0,
      nasc: document.getElementById('al-nasc').value || null,
      faixa: document.getElementById('al-faixa').value,
      grau: parseInt(document.getElementById('al-grau').value, 10) || 0,
      pontos: 0,
      presencas: 0,
      faltas: 0,
      obs: '',
      foto: '',
      ativo: true
    });
    ['al-nome', 'al-tel', 'al-idade', 'al-nasc'].forEach((id) => { const e = document.getElementById(id); if (e) e.value = ''; });
    await refreshData();
    renderAlunos(); renderDash(); renderRanking(); renderRankingPub(); popAllSels();
    toast(`✅ ${nome} cadastrado!`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== MODAL DETALHE ====
window.openModal = function openModal(id) {
  editingId = id;
  const a = alunos.find((x) => x.id === id); if (!a) return;
  document.getElementById('modal-nome-title').textContent = a.nome;
  document.getElementById('modal-nome').textContent = a.nome;
  const avEl = document.getElementById('modal-av');
  avEl.innerHTML = a.foto ? `<img src="${a.foto}" alt="${a.nome}">` : `${ini(a.nome)}`;
  document.getElementById('modal-faixa').innerHTML = faixaBadge(a.faixa, a.grau);
  document.getElementById('ed-nome').value = a.nome;
  document.getElementById('ed-tel').value = a.tel || '';
  document.getElementById('ed-idade').value = a.idade || 0;
  document.getElementById('ed-nasc').value = a.nasc || '';
  document.getElementById('ed-faixa').value = a.faixa;
  document.getElementById('ed-grau').value = a.grau || 0;
  document.getElementById('ed-obs').value = a.obs || '';
  const p2 = pct(a);
  document.getElementById('modal-stats').innerHTML = `<div class="info-row"><span class="info-label">Pontos</span><span class="info-val" style="color:var(--d);font-weight:700;font-family:'Barlow Condensed',sans-serif;font-size:1.2rem;">${a.pontos || 0}</span></div><div class="info-row"><span class="info-label">Presenças</span><span class="info-val">${a.presencas || 0}</span></div><div class="info-row"><span class="info-label">Faltas</span><span class="info-val">${a.faltas || 0}</span></div><div class="info-row"><span class="info-label">Frequência</span><span class="info-val" style="color:${p2 >= 75 ? 'var(--vc)' : p2 >= 50 ? 'var(--d)' : '#f87171'};">${p2}%</span></div>${a.nasc ? `<div class="info-row"><span class="info-label">Aniversário</span><span class="info-val">🎂 ${fmtDate(a.nasc)}</span></div>` : ''}${a.obs ? `<div class="info-row"><span class="info-label">Obs</span><span class="info-val" style="font-size:.82rem;color:rgba(245,240,232,.5);">${a.obs}</span></div>` : ''}`;
  const waBtn = document.getElementById('modal-wa-btn');
  if (waBtn && a.tel && a.tel !== '—') waBtn.innerHTML = `<a href="${waLink(a.tel)}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:white;padding:9px 14px;border-radius:7px;font-size:.8rem;font-weight:700;text-decoration:none;letter-spacing:.5px;">💬 Contato WhatsApp</a>`;
  document.getElementById('modal-aluno').classList.add('open');
};

window.closeModal = function closeModal() { document.getElementById('modal-aluno').classList.remove('open'); editingId = null; };

window.salvarEdicao = async function salvarEdicao() {
  const a = alunos.find((x) => x.id === editingId); if (!a) return;
  try {
    await updateAluno(editingId, {
      nome: document.getElementById('ed-nome').value.trim() || a.nome,
      tel: document.getElementById('ed-tel').value.trim(),
      idade: parseInt(document.getElementById('ed-idade').value, 10) || a.idade,
      nasc: document.getElementById('ed-nasc').value || null,
      faixa: document.getElementById('ed-faixa').value,
      grau: parseInt(document.getElementById('ed-grau').value, 10) || 0,
      obs: document.getElementById('ed-obs').value
    });
    await refreshData();
    closeModal(); renderAlunos(); renderDash(); renderRanking(); renderRankingPub(); popAllSels();
    toast(`💾 ${a.nome} atualizado!`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

window.promoverModal = async function promoverModal() {
  const a = alunos.find((x) => x.id === editingId); if (!a) return;
  const ordem = ['branca', 'azul', 'roxa', 'marrom', 'preta'];
  let faixa = a.faixa; let grau = a.grau || 0;
  if (grau < 4) grau++; else if (ordem.indexOf(faixa) < ordem.length - 1) { faixa = ordem[ordem.indexOf(faixa) + 1]; grau = 0; }
  try {
    await updateAluno(editingId, { faixa, grau });
    await refreshData();
    closeModal(); renderAlunos(); renderDash(); renderRanking();
    toast(`🎉 ${a.nome} promovido! ${FL[faixa]} ${grau > 0 ? grau + '° grau' : ''}`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

window.removerModal = async function removerModal() {
  const a = alunos.find((x) => x.id === editingId); if (!a) return;
  try {
    await deactivateAluno(editingId);
    await refreshData();
    closeModal(); renderAlunos(); renderDash(); renderRanking(); renderRankingPub(); popAllSels();
    toast('Aluno removido');
  } catch (e) { toast(`❌ ${e.message}`); }
};

window.triggerFotoUpload = function triggerFotoUpload() { document.getElementById('foto-input').click(); };
window.handleFotoUpload = async function handleFotoUpload(e) {
  const file = e.target.files[0]; if (!file || !editingId) return;
  try {
    await uploadAlunoFoto(editingId, file);
    await refreshData();
    const a = alunos.find((x) => x.id === editingId);
    const avEl = document.getElementById('modal-av');
    if (a && avEl) avEl.innerHTML = `<img src="${a.foto}" alt="${a.nome}">`;
    renderAlunos(); renderDash(); renderRankingPub();
    toast('📸 Foto atualizada!');
  } catch (err) { toast(`❌ ${err.message}`); }
};

window.handleCfgFoto = async function handleCfgFoto(e) {
  const file = e.target.files[0]; if (!file) return;
  try {
    const url = await uploadLandingFoto(file);
    const cfgPrev = document.getElementById('cfg-foto-preview'); const cfgPh = document.getElementById('cfg-foto-placeholder');
    if (cfgPrev) { cfgPrev.src = url; cfgPrev.style.display = 'block'; }
    if (cfgPh) cfgPh.style.display = 'none';
    toast('📸 Foto atualizada na landing page!');
  } catch (err) { toast(`❌ ${err.message}`); }
};

function renderRanking() {
  const el = document.getElementById('ranking-full'); if (!el) return;
  const sorted = [...alunos].sort((a, b) => (b.pontos || 0) - (a.pontos || 0));
  el.innerHTML = sorted.map((a, i) => `<div class="rank-item"><span class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</span>${avatarEl(a, 36)}<div class="rank-info"><div class="rank-name">${a.nome}</div><div class="rank-belt">${faixaBadge(a.faixa, a.grau)}</div></div><div style="text-align:right;"><div class="rank-pts">${a.pontos || 0} pts</div><div style="font-size:.7rem;color:rgba(245,240,232,.35);">${a.presencas || 0} presenças</div></div><a href="${waLink(a.tel)}" target="_blank" style="background:#25D366;color:white;padding:5px 10px;border-radius:5px;font-size:.7rem;font-weight:700;text-decoration:none;margin-left:.5rem;">💬</a></div>`).join('');
}

// ==== PRESENÇA ====
function renderChamada() {
  const tb = document.getElementById('chamada-tb'); if (!tb) return;
  presencaState = {}; alunos.forEach((a) => presencaState[a.id] = false);
  tb.innerHTML = alunos.map((a) => `<tr><td><div style="display:flex;align-items:center;gap:8px;">${avatarEl(a, 30)}${a.nome}</div></td><td>${faixaBadge(a.faixa, a.grau)}</td><td><button class="check-btn" id="chk-${a.id}" onclick="togPres(${a.id})">✓</button></td></tr>`).join('');
  updPresCount();
}
window.togPres = function togPres(id) { presencaState[id] = !presencaState[id]; const b = document.getElementById('chk-' + id); if (b) b.classList.toggle('checked', presencaState[id]); updPresCount(); };
function updPresCount() { const c = Object.values(presencaState).filter(Boolean).length; const e = document.getElementById('pres-count'); if (e) e.textContent = `${c} presentes`; }

window.salvarPresenca = async function salvarPresenca() {
  const data = document.getElementById('pres-data').value || today();
  const dia = document.getElementById('pres-dia').value;
  try {
    let c = 0;
    const logs = [];
    for (const [id, p] of Object.entries(presencaState)) {
      const a = alunos.find((x) => x.id === parseInt(id, 10)); if (!a) continue;
      const payload = { presencas: a.presencas || 0, faltas: a.faltas || 0, pontos: a.pontos || 0 };
      if (p) { payload.presencas += 1; payload.pontos += 1; c += 1; logs.push({ data, dia, aluno_id: a.id, nome: a.nome, presente: true }); }
      else { payload.faltas += 1; logs.push({ data, dia, aluno_id: a.id, nome: a.nome, presente: false }); }
      await updateAluno(a.id, payload);
    }
    await insertPresencaLogs(logs);
    await refreshData();
    presencaState = {}; renderChamada(); renderAlunos(); renderDash(); renderRanking(); renderRankingPub();
    toast(`✅ Presença salva! ${c} alunos presentes (+1 pt cada)`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== RELATÓRIO ====
window.gerarRelatorio = function gerarRelatorio() {
  const inicio = document.getElementById('rel-inicio').value;
  const fim = document.getElementById('rel-fim').value;
  const alunoId = document.getElementById('rel-aluno').value;
  if (!inicio || !fim) { toast('❌ Informe o período'); return; }
  const logs = presencaLog.filter((l) => l.data >= inicio && l.data <= fim && (alunoId === '' || l.aluno_id === parseInt(alunoId, 10)));
  const el = document.getElementById('relatorio-resultado'); if (!el) return;
  if (!logs.length) { el.innerHTML = '<div class="panel"><div class="panel-body" style="text-align:center;color:rgba(245,240,232,.35);padding:2rem;">Nenhum registro no período selecionado</div></div>'; return; }
  const byAluno = {};
  logs.forEach((l) => { if (!byAluno[l.aluno_id]) byAluno[l.aluno_id] = { nome: l.nome, presencas: 0, faltas: 0 }; if (l.presente) byAluno[l.aluno_id].presencas++; else byAluno[l.aluno_id].faltas++; });
  const rows = Object.values(byAluno).map((r) => { const total = r.presencas + r.faltas; const freq = total > 0 ? Math.round((r.presencas / total) * 100) : 0; return `<tr><td style="font-weight:600;">${r.nome}</td><td style="color:var(--vc);">${r.presencas}</td><td style="color:#f87171;">${r.faltas}</td><td>${total}</td><td style="color:${freq >= 75 ? 'var(--vc)' : freq >= 50 ? 'var(--d)' : '#f87171'};font-weight:700;">${freq}%</td></tr>`; }).join('');
  el.innerHTML = `<div class="panel" id="print-area"><div class="panel-header"><span class="panel-title">📊 Relatório: ${fmtDateFull(inicio)} a ${fmtDateFull(fim)}</span><span style="font-size:.8rem;color:rgba(245,240,232,.4);">${logs.length} registros</span></div><div style="overflow-x:auto;"><table><thead><tr><th>Aluno</th><th>Presenças</th><th>Faltas</th><th>Total Aulas</th><th>Frequência</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
};
window.imprimirRelatorio = function imprimirRelatorio() { window.gerarRelatorio(); setTimeout(() => window.print(), 300); };

// ==== CALENDÁRIO ====
function renderCalendario() {
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  document.getElementById('cal-month-label').textContent = `${meses[calMonth]} ${calYear}`;
  const grid = document.getElementById('cal-grid'); if (!grid) return;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const todayStr = today();
  let cells = '';
  for (let i = firstDay - 1; i >= 0; i--) cells += `<div class="cal-day other-month"><div class="cal-day-num">${daysInPrev - i}</div></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayOfWeek = new Date(calYear, calMonth, d).getDay();
    const isAula = dayOfWeek === 1 || dayOfWeek === 4;
    const dayEvents = eventos.filter((e) => e.data === dateStr);
    let evHtml = ''; if (isAula) evHtml += '<div class="cal-event aula">🥋 Aula</div>';
    dayEvents.forEach((e) => { evHtml += `<div class="cal-event ${e.tipo}">${e.titulo}</div>`; });
    const hasEv = isAula || dayEvents.length > 0;
    cells += `<div class="cal-day${isToday ? ' today' : ''}${hasEv ? ' has-event' : ''}"><div class="cal-day-num">${d}</div>${evHtml}</div>`;
  }
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let d = 1; d <= totalCells - (firstDay + daysInMonth); d++) cells += `<div class="cal-day other-month"><div class="cal-day-num">${d}</div></div>`;
  grid.innerHTML = cells;
}
window.calNav = function calNav(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendario(); };
window.addEvento = async function addEvento() {
  const titulo = document.getElementById('ev-titulo').value.trim(); const data = document.getElementById('ev-data').value; const tipo = document.getElementById('ev-tipo').value;
  if (!titulo || !data) { toast('❌ Informe título e data'); return; }
  try { await createEvento({ titulo, data, tipo }); await refreshData(); renderCalendario(); document.getElementById('ev-titulo').value = ''; toast(`📅 Evento "${titulo}" adicionado!`); }
  catch (e) { toast(`❌ ${e.message}`); }
};

// ==== PONTOS ====
window.darPontos = async function darPontos() {
  const id = parseInt(document.getElementById('pt-aluno').value, 10);
  const motEl = document.getElementById('pt-motivo');
  const pts = parseInt(motEl.value, 10) + (parseInt(document.getElementById('pt-extra').value, 10) || 0);
  const a = alunos.find((x) => x.id === id); if (!a) return;
  try {
    await updateAluno(a.id, { pontos: (a.pontos || 0) + pts });
    await refreshData();
    const log = document.getElementById('pts-log');
    if (log) {
      const d = document.createElement('div');
      d.style.cssText = 'font-size:.8rem;color:rgba(245,240,232,.55);padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);';
      d.innerHTML = `<span style="color:var(--d);font-weight:700;">+${pts} pts</span> para <strong>${a.nome}</strong> — ${motEl.options[motEl.selectedIndex].text}`;
      log.prepend(d);
    }
    renderAlunos(); renderDash(); renderRanking(); renderRankingPub();
    toast(`⭐ +${pts} pts para ${a.nome}!`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== DEVOCIONAL ====
function renderDevocionais() {
  const el = document.getElementById('devo-list'); if (!el) return;
  el.innerHTML = devocionais.slice(0, 8).map((d) => `<div class="devo-slot"><div><div class="devo-day">${d.dia === 'seg' ? 'Segunda' : 'Quinta'}</div><div class="devo-date">${fmtDate(d.data)}</div></div><div><div class="devo-name">${d.aluno}</div><div class="devo-date" style="color:var(--vc);">${d.passagem || ''}</div></div></div>`).join('');
}
window.agendarDevo = async function agendarDevo() {
  const id = parseInt(document.getElementById('dv-aluno').value, 10); const a = alunos.find((x) => x.id === id); if (!a) return;
  const data = document.getElementById('dv-data').value; const dia = document.getElementById('dv-dia').value; const passagem = document.getElementById('dv-passagem').value.trim() || 'A definir';
  try {
    await createDevocional({ dia, data, aluno: a.nome, aluno_id: a.id, passagem });
    await updateAluno(a.id, { pontos: (a.pontos || 0) + 3 });
    await refreshData();
    renderDevocionais(); renderDash();
    toast(`✝ Devocional agendado para ${a.nome}`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== PROFESSORES ====
function renderProfs() {
  const el = document.getElementById('prof-list'); if (!el) return;
  const nivelLabel = { admin: 'Admin', prof: 'Professor', assist: 'Assistente' };
  const nivelClass = { admin: 'nivel-admin', prof: 'nivel-prof', assist: 'nivel-assist' };
  el.innerHTML = professores.map((p) => `<div class="prof-card"><div class="avatar" style="width:44px;height:44px;font-size:.9rem;">${ini(p.nome)}</div><div style="flex:1;"><div style="font-weight:600;font-size:.92rem;">${p.nome}</div><div style="font-size:.75rem;color:rgba(245,240,232,.4);">@${p.user_login || p.email || ''}</div></div><span class="prof-nivel ${nivelClass[p.nivel]}">${nivelLabel[p.nivel]}</span>${p.id !== currUserProf()?.id ? `<button class="btn-sm btn-r" style="font-size:.7rem;padding:5px 10px;" onclick="removerProf(${p.id})">✕</button>` : '<span style="font-size:.7rem;color:rgba(245,240,232,.2);">principal</span>'}</div>`).join('');
}
window.cadastrarProf = async function cadastrarProf() {
  const nome = document.getElementById('pf-nome').value.trim(); const user = document.getElementById('pf-user').value.trim(); const pass = document.getElementById('pf-pass').value; const nivel = document.getElementById('pf-nivel').value;
  if (!nome || !user || !pass) { toast('❌ Preencha nome, usuário e senha'); return; }
  if (!professores.some((p) => p.user_login === user)) {
    try {
      await createProfessorWithAuth(user, pass, nome, nivel);
      ['pf-nome', 'pf-user', 'pf-pass'].forEach((id) => { const e = document.getElementById(id); if (e) e.value = ''; });
      await refreshData(); renderProfs(); toast(`✅ Prof. ${nome} cadastrado e usuário criado!`);
    } catch (e) { toast(`❌ ${e.message}`); }
  } else toast('❌ Usuário já existe');
};
window.removerProf = async function removerProf(id) { try { await removeProfessor(id); await refreshData(); renderProfs(); toast('Professor removido'); } catch (e) { toast(`❌ ${e.message}`); } };

// ==== CAMPEONATOS ====
function renderCamp() {
  const tb = document.getElementById('camp-tb'); if (!tb) return;
  if (!campeonatos.length) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(245,240,232,.25);padding:2rem;">Nenhum registro</td></tr>'; return; }
  tb.innerHTML = campeonatos.map((c) => `<tr><td>${c.aluno}</td><td>${c.camp}</td><td>${c.res}</td><td style="color:var(--d);font-weight:700;">+${c.pts}</td></tr>`).join('');
}
window.regCamp = async function regCamp() {
  const id = parseInt(document.getElementById('camp-aluno').value, 10); const a = alunos.find((x) => x.id === id); if (!a) return;
  const nome = document.getElementById('camp-nome').value.trim(); if (!nome) { toast('Informe o nome do campeonato'); return; }
  const rv = document.getElementById('camp-res').value; const pts = parseInt(rv.split('_')[0], 10);
  const labels = { 20: 'Participou', '50_3': '🥉 3º Lugar', '50_2': '🥈 2º Lugar', '50_1': '🥇 Campeão' };
  try {
    await createCampeonato({ aluno: a.nome, aluno_id: a.id, camp: nome, res: labels[rv], pts });
    await updateAluno(a.id, { pontos: (a.pontos || 0) + pts });
    await refreshData(); renderCamp(); renderAlunos(); renderDash(); renderRanking(); renderRankingPub();
    toast(`🏆 ${labels[rv]} para ${a.nome}! +${pts} pts`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== CESTAS ====
function renderCestas() {
  const tb = document.getElementById('cestas-tb'); if (!tb) return;
  const total = cestas.filter((c) => c.tipo === 'cesta').reduce((s, c) => s + (c.qtd || 0), 0);
  const kg = cestas.filter((c) => c.tipo === 'kg').reduce((s, c) => s + (c.qtd || 0), 0);
  document.getElementById('c-total').textContent = total; document.getElementById('c-kg').textContent = kg;
  if (!cestas.length) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(245,240,232,.25);padding:2rem;">Nenhuma contribuição</td></tr>'; return; }
  tb.innerHTML = cestas.map((c) => `<tr><td>${c.aluno}</td><td>${c.tipo === 'cesta' ? 'Cesta Básica' : 'Alimentos (kg)'}</td><td>${c.qtd}</td><td style="color:var(--d);font-weight:700;">+${c.pts}</td></tr>`).join('');
}
window.regCesta = async function regCesta() {
  const id = parseInt(document.getElementById('cesta-aluno').value, 10); const a = alunos.find((x) => x.id === id); if (!a) return;
  const tipo = document.getElementById('cesta-tipo').value; const qtd = parseInt(document.getElementById('cesta-qtd').value, 10) || 1; const pts = tipo === 'cesta' ? qtd * 20 : qtd * 3;
  try {
    await createCesta({ aluno: a.nome, aluno_id: a.id, tipo, qtd, pts });
    await updateAluno(a.id, { pontos: (a.pontos || 0) + pts });
    await refreshData(); renderCestas(); renderAlunos(); renderDash(); renderRanking(); renderRankingPub();
    toast(`🥫 ${tipo === 'cesta' ? 'Cesta básica' : 'Alimentos'} registrado para ${a.nome}! +${pts} pts`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== RECOMPENSAS ====
function renderRecomp() {
  const tb = document.getElementById('rec-tb'); if (!tb) return;
  if (!recompensas.length) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(245,240,232,.25);padding:2rem;">Nenhum resgate ainda</td></tr>'; return; }
  tb.innerHTML = recompensas.map((r) => `<tr><td>${r.aluno}</td><td>${r.item}</td><td style="color:#f87171;font-weight:700;">-${r.pts}</td><td style="font-size:.78rem;color:rgba(245,240,232,.4);">${r.data}</td></tr>`).join('');
}
window.regRecompensa = async function regRecompensa() {
  const id = parseInt(document.getElementById('rec-aluno').value, 10); const a = alunos.find((x) => x.id === id); if (!a) return;
  const sel = document.getElementById('rec-item').value.split('|'); const pts = parseInt(sel[0], 10); const item = sel[1];
  if ((a.pontos || 0) < pts) { toast(`❌ ${a.nome} só tem ${a.pontos || 0} pts. Precisa de ${pts}.`); return; }
  try {
    await createRecompensa({ aluno: a.nome, aluno_id: a.id, item, pts, data: new Date().toLocaleDateString('pt-BR') });
    await updateAluno(a.id, { pontos: (a.pontos || 0) - pts });
    await refreshData(); renderRecomp(); renderAlunos(); renderDash(); renderRanking(); renderRankingPub();
    toast(`🎁 ${item} resgatado para ${a.nome}! -${pts} pts`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== METAS ADMIN ====
function renderMetasAdm() {
  const el = document.getElementById('metas-adm-list'); if (!el) return;
  el.innerHTML = metas.map((m, i) => {
    const isN = m.tipo === 'cestas';
    const cur = isN ? (m.atualn ?? 0) : (m.atual || 0);
    const tot = isN ? (m.metan ?? 0) : (m.meta || 0);
    const p = tot > 0 ? Math.min(100, Math.round((cur / tot) * 100)) : 0;
    return `<div class="meta-card"><div class="meta-header"><div><div class="meta-title">${m.titulo}</div><div class="meta-detail">${m.detalhe || ''}</div></div><div class="meta-valor">${isN ? cur + ' cestas' : 'R$ ' + Number(cur).toLocaleString('pt-BR')}<br><span class="meta-percentual">meta: ${isN ? tot + ' cestas' : 'R$ ' + Number(tot).toLocaleString('pt-BR')}</span></div></div><div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div><div style="display:flex;justify-content:space-between;align-items:center;"><span class="meta-detail">${p}%</span><div style="display:flex;gap:.5rem;align-items:center;"><input type="number" id="mu-${i}" placeholder="Novo valor" style="width:110px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);border-radius:5px;padding:5px 9px;color:var(--cr);font-size:.8rem;outline:none;"><button class="btn-sm btn-v" style="font-size:.72rem;" onclick="updMeta(${i})">Salvar</button></div></div></div>`;
  }).join('');
}
window.updMeta = async function updMeta(i) {
  const v = parseFloat(document.getElementById('mu-' + i).value); if (isNaN(v)) return;
  const m = metas[i]; if (!m) return;
  try {
    if (m.tipo === 'cestas') await saveMeta({ ...m, atualn: v }); else await saveMeta({ ...m, atual: v });
    await refreshData(); renderMetasAdm(); renderMetasPub(); toast('📊 Meta atualizada!');
  } catch (e) { toast(`❌ ${e.message}`); }
};
window.addMeta = async function addMeta() {
  const t = document.getElementById('mt-titulo').value.trim(); const m = parseFloat(document.getElementById('mt-meta').value) || 0; const a = parseFloat(document.getElementById('mt-atual').value) || 0; const d = document.getElementById('mt-detalhe').value.trim();
  if (!t) { toast('Informe o título'); return; }
  try {
    await saveMeta({ titulo: t, meta: m, atual: a, detalhe: d, ordem: metas.length + 1 });
    ['mt-titulo', 'mt-meta', 'mt-atual', 'mt-detalhe'].forEach((id) => { const e = document.getElementById(id); if (e) e.value = ''; });
    await refreshData(); renderMetasAdm(); renderMetasPub(); toast('🎯 Nova meta adicionada!');
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== INSCRIÇÕES ====
function renderIns() {
  const tb = document.getElementById('ins-tb'); if (!tb) return;
  const pend = inscricoes.filter((i) => i.status === 'pendente');
  if (!pend.length) { tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:rgba(245,240,232,.25);padding:2rem;">Nenhuma inscrição</td></tr>'; return; }
  tb.innerHTML = pend.map((ins, i) => `<tr><td style="font-weight:600;">${ins.nome}</td><td>${ins.idade || '?'}</td><td><a href="${waLink(ins.tel)}" target="_blank" style="color:#25D366;text-decoration:none;font-weight:600;">💬 ${ins.tel}</a></td><td>${ins.dia || 'A definir'}</td><td style="font-size:.78rem;">${ins.exp || ''}</td><td><span style="background:rgba(234,179,8,.12);color:#fbbf24;padding:2px 9px;border-radius:100px;font-size:.67rem;font-weight:600;letter-spacing:1px;">PENDENTE</span></td><td><button class="btn-sm btn-v" style="font-size:.7rem;padding:6px 10px;" onclick="converterIns(${ins.id})">→ Cadastrar</button></td></tr>`).join('');
}
window.converterIns = async function converterIns(id) {
  const ins = inscricoes.find((x) => x.id === id); if (!ins) return;
  try {
    await createAluno({ nome: ins.nome, tel: ins.tel, idade: parseInt(ins.idade, 10) || 0, nasc: null, faixa: 'branca', grau: 0, pontos: 0, presencas: 0, faltas: 0, obs: 'Veio pelo formulário de inscrição', foto: '', ativo: true });
    await updateInscricaoStatus(ins.id, 'convertida');
    await refreshData(); renderIns(); renderAlunos(); renderDash(); renderRankingPub(); popAllSels();
    toast(`✅ ${ins.nome} cadastrado como aluno!`);
  } catch (e) { toast(`❌ ${e.message}`); }
};

// ==== CONFIGURAÇÕES ====
function renderConfig() {
  const cfgPrev = document.getElementById('cfg-foto-preview'); const cfgPh = document.getElementById('cfg-foto-placeholder');
  const fotoUrl = config.find((c) => c.chave === 'landing_foto_url')?.valor;
  if (cfgPrev && fotoUrl) { cfgPrev.src = fotoUrl; cfgPrev.style.display = 'block'; if (cfgPh) cfgPh.style.display = 'none'; }
}
window.salvarConfig = async function salvarConfig() {
  try {
    await saveConfig('nome_projeto', document.getElementById('cfg-nome').value || 'Jiu-Jitsu Reformado');
    await saveConfig('horario', document.getElementById('cfg-horario').value || '19h30 – 21h00');
    await saveConfig('endereco', document.getElementById('cfg-endereco').value || '');
    toast('✅ Configurações salvas!');
  } catch (e) { toast(`❌ ${e.message}`); }
};
window.alterarSenha = function alterarSenha() { toast('ℹ️ A senha é gerenciada pelo Supabase Auth (Authentication > Users).'); };

window.logout = async function logout() { await apiLogout(); window.location.href = './index.html'; };

(async function boot() {
  console.log('🚀 Boot iniciado');
  try {
    const session = await getSession();
    console.log('🔐 Session verificada:', session ? 'OK' : 'Não encontrada');
    if (!session) { window.location.href = './index.html'; return; }
    
    currentProfile = await getProfessorProfileBySession();
    console.log('👤 Professor profile:', currentProfile?.nome);
    if (!currentProfile) { window.location.href = './index.html'; return; }

    const label = document.getElementById('user-label');
    if (label) label.textContent = `${currentProfile.nome} · ${currentProfile.nivel === 'admin' ? 'Admin' : currentProfile.nivel === 'prof' ? 'Professor' : 'Assistente'}`;

    const navBar = document.getElementById('app-nav');
    if (navBar) navBar.style.display = 'flex';
    console.log('🎨 Nav bar mostrada');

    console.log('⏳ Iniciando app...');
    await initApp();
    console.log('✅ Boot completo!');
  } catch (e) {
    console.error('❌ Erro em boot:', e);
    showFatalError(e.message || 'Erro ao iniciar painel');
  }
})();
