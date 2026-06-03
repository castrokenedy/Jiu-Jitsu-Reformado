import { requireProfessor, logout } from './auth.js';
import { listarAlunos, cadastrarAluno, editarAluno, excluirAluno, enviarFotoAluno, listarRanking, listarAniversariosProximos } from './alunos.js';
import { salvarChamada, listarPresencas, agruparRelatorioPresenca } from './presenca.js';
import { listarDevocionais, agendarDevocional } from './devocionais.js';
import { listarCampeonatos, registrarCampeonato, listarCestas, registrarCesta, listarRecompensas, registrarRecompensa, listarEventos, criarEvento } from './campeonatos.js';
import { listarPontuacoes, pontuarManual, listarMetas, salvarMeta, listarInscricoes, atualizarInscricao, listarProfessores, criarProfessor, removerProfessor, listarConfiguracoes, uploadLandingImage } from './data.js';
import { BELT_LABELS, DEFAULT_POINTS } from './supabase-config.js';
import { qs, toast, formatDate, formatDateTime, frequencyPct, whatsappLink, initials, escapeHtml } from './utils.js';

const state = {
  profile: null,
  alunos: [],
  ranking: [],
  presencas: [],
  devocionais: [],
  campeonatos: [],
  cestas: [],
  recompensas: [],
  pontos: [],
  metas: [],
  inscricoes: [],
  professores: [],
  eventos: [],
  config: []
};

async function refreshState() {
  const [alunos, ranking, presencas, devocionais, campeonatos, cestas, recompensas, pontos, metas, inscricoes, professores, eventos, config] = await Promise.all([
    listarAlunos(),
    listarRanking(200),
    listarPresencas(),
    listarDevocionais(),
    listarCampeonatos(),
    listarCestas(),
    listarRecompensas(),
    listarPontuacoes(150),
    listarMetas(),
    listarInscricoes('pendente'),
    listarProfessores(),
    listarEventos(),
    listarConfiguracoes()
  ]);

  Object.assign(state, { alunos, ranking, presencas, devocionais, campeonatos, cestas, recompensas, pontos, metas, inscricoes, professores, eventos, config });
}

function alunoOptions() {
  return state.alunos.map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join('');
}

function renderDashboard() {
  const mediaFreq = state.alunos.length ? Math.round(state.alunos.reduce((acc, a) => acc + frequencyPct(a.presencas || 0, a.faltas || 0), 0) / state.alunos.length) : 0;
  const totalPontos = state.alunos.reduce((acc, a) => acc + (a.pontos_total || 0), 0);
  const totalCestas = state.cestas.filter((c) => c.tipo === 'cesta').reduce((acc, c) => acc + c.quantidade, 0);
  const top = state.ranking.slice(0, 6);

  qs('sec-dashboard').innerHTML = `
    <div class="cards">
      <div class="card"><h3>Alunos Ativos</h3><strong>${state.alunos.length}</strong></div>
      <div class="card"><h3>Média Presença</h3><strong>${mediaFreq}%</strong></div>
      <div class="card"><h3>Cestas</h3><strong>${totalCestas}</strong></div>
      <div class="card"><h3>Inscrições Pendentes</h3><strong>${state.inscricoes.length}</strong></div>
      <div class="card"><h3>Pontos Totais</h3><strong>${totalPontos}</strong></div>
    </div>
    <div class="card">
      <h3>Top Ranking</h3>
      ${top.map((a, i) => `<div class="line"><span>#${i + 1} ${escapeHtml(a.nome)}</span><span>${a.pontos_total} pts</span></div>`).join('') || '<p>Sem dados.</p>'}
    </div>
    <div class="card">
      <h3>Aniversários (7 dias)</h3>
      <div id="dash-bdays">Carregando...</div>
    </div>
  `;

  listarAniversariosProximos().then((rows) => {
    const el = qs('dash-bdays');
    el.innerHTML = rows.length
      ? rows.map((a) => `<div class="line"><span>${escapeHtml(a.nome)} · ${formatDate(a.data_nascimento)}</span><a target="_blank" href="${whatsappLink(a.telefone || '')}">WhatsApp</a></div>`).join('')
      : '<p>Nenhum aniversário próximo.</p>';
  });
}

function renderAlunos() {
  qs('sec-alunos').innerHTML = `
    <div class="card">
      <h3>Cadastrar Aluno</h3>
      <form id="form-aluno" class="grid two">
        <input name="nome" placeholder="Nome completo" required />
        <input name="telefone" placeholder="WhatsApp" />
        <input name="idade" type="number" placeholder="Idade" min="10" />
        <input name="data_nascimento" type="date" />
        <select name="faixa"><option value="branca">Branca</option><option value="azul">Azul</option><option value="roxa">Roxa</option><option value="marrom">Marrom</option><option value="preta">Preta</option></select>
        <select name="grau"><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
        <textarea class="full" name="observacoes" placeholder="Observações"></textarea>
        <button class="full" type="submit">Salvar</button>
      </form>
    </div>
    <div class="card">
      <h3>Lista de Alunos</h3>
      <table>
        <thead><tr><th>Aluno</th><th>Faixa</th><th>Pontos</th><th>Freq.</th><th>Foto</th><th>Ações</th></tr></thead>
        <tbody>
        ${state.alunos.map((a) => `
          <tr>
            <td>${escapeHtml(a.nome)}<br/><small>${a.telefone || '-'}</small></td>
            <td>${BELT_LABELS[a.faixa] || '-'} · ${a.grau || 0}º</td>
            <td>${a.pontos_total || 0}</td>
            <td>${frequencyPct(a.presencas || 0, a.faltas || 0)}%</td>
            <td>
              <label class="upload-btn">📸
                <input type="file" data-upload-aluno="${a.id}" accept="image/*" hidden />
              </label>
            </td>
            <td>
              <button data-edit-aluno="${a.id}">Editar</button>
              <button data-del-aluno="${a.id}">Excluir</button>
            </td>
          </tr>
        `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRanking() {
  qs('sec-ranking').innerHTML = `<div class="card"><h3>Ranking Geral</h3>${state.ranking.map((a, i) => `<div class="line"><span>#${i + 1} ${escapeHtml(a.nome)}</span><span>${a.pontos_total} pts</span></div>`).join('')}</div>`;
}

function renderPresenca() {
  qs('sec-presenca').innerHTML = `
    <div class="card">
      <h3>Chamada de Presença</h3>
      <form id="form-presenca">
        <div class="grid two">
          <input name="data_aula" type="date" required value="${new Date().toISOString().slice(0,10)}" />
          <select name="tipo_aula"><option value="seg">Segunda</option><option value="qui">Quinta</option></select>
        </div>
        <div class="check-list">${state.alunos.map((a) => `<label><input type="checkbox" name="alunos" value="${a.id}" /> ${escapeHtml(a.nome)}</label>`).join('')}</div>
        <button type="submit">Salvar presença (+5)</button>
      </form>
    </div>
  `;
}

function renderRelatorio() {
  qs('sec-relatorio').innerHTML = `
    <div class="card">
      <h3>Relatório de Presença</h3>
      <form id="form-relatorio" class="grid two">
        <input type="date" name="inicio" required />
        <input type="date" name="fim" required />
        <select name="aluno_id"><option value="">Todos os alunos</option>${alunoOptions()}</select>
        <button type="submit">Gerar</button>
      </form>
      <div id="output-relatorio"></div>
    </div>
  `;
}

function renderCalendario() {
  qs('sec-calendario').innerHTML = `
    <div class="card">
      <h3>Calendário / Eventos</h3>
      <form id="form-evento" class="grid two">
        <input name="titulo" placeholder="Título do evento" required />
        <input name="data_evento" type="date" required />
        <select name="tipo"><option value="aula">Aula</option><option value="evento">Evento</option><option value="camp">Campeonato</option></select>
        <button type="submit">Adicionar evento</button>
      </form>
      <table><thead><tr><th>Data</th><th>Título</th><th>Tipo</th></tr></thead><tbody>${state.eventos.map((e) => `<tr><td>${formatDate(e.data_evento)}</td><td>${escapeHtml(e.titulo)}</td><td>${e.tipo}</td></tr>`).join('')}</tbody></table>
    </div>
  `;
}

function renderPontos() {
  qs('sec-pontos').innerHTML = `
    <div class="card">
      <h3>Dar Pontos</h3>
      <form id="form-pontos" class="grid two">
        <select name="aluno_id" required>${alunoOptions()}</select>
        <select name="tipo" required>
          <option value="devocional">Devocional (+3)</option>
          <option value="visitante">Visitante (+10)</option>
          <option value="camp_participacao">Campeonato participação (+8)</option>
          <option value="camp_podio">Campeonato pódio (+20)</option>
          <option value="alimento_kg">1kg alimento (+5)</option>
          <option value="cesta_basica">Cesta básica (+15)</option>
          <option value="especial">Participação especial (+2)</option>
        </select>
        <input name="pontos" type="number" placeholder="Pontos finais (opcional)" />
        <input name="descricao" placeholder="Descrição" />
        <button class="full" type="submit">Lançar pontuação</button>
      </form>
      <h4>Últimos lançamentos</h4>
      ${state.pontos.slice(0, 30).map((p) => `<div class="line"><span>${formatDateTime(p.created_at)} · ${escapeHtml(p.alunos?.nome || '-')}</span><span>${p.pontos > 0 ? '+' : ''}${p.pontos}</span></div>`).join('')}
    </div>
  `;
}

function renderDevocional() {
  qs('sec-devocional').innerHTML = `
    <div class="card">
      <h3>Escala de Devocional</h3>
      <form id="form-devocional" class="grid two">
        <select name="aluno_id" required>${alunoOptions()}</select>
        <input name="data_devocional" type="date" required />
        <select name="dia_semana"><option value="seg">Segunda</option><option value="qui">Quinta</option></select>
        <input name="passagem" placeholder="Passagem bíblica" />
        <button class="full" type="submit">Agendar</button>
      </form>
      ${state.devocionais.map((d) => `<div class="line"><span>${formatDate(d.data_devocional)} · ${escapeHtml(d.alunos?.nome || '-')}</span><span>${escapeHtml(d.passagem || 'A definir')}</span></div>`).join('')}
    </div>
  `;
}

function renderCampeonatos() {
  qs('sec-campeonatos').innerHTML = `
    <div class="card">
      <h3>Campeonatos</h3>
      <form id="form-campeonato" class="grid two">
        <select name="aluno_id" required>${alunoOptions()}</select>
        <input name="nome_evento" placeholder="Nome do campeonato" required />
        <input name="data_evento" type="date" required />
        <select name="resultado"><option value="participou">Participou (+8)</option><option value="podio">Pódio (+20)</option><option value="campeao">Campeão (+20)</option></select>
        <button class="full" type="submit">Registrar campeonato</button>
      </form>
      <table><thead><tr><th>Data</th><th>Aluno</th><th>Evento</th><th>Resultado</th><th>Pontos</th></tr></thead><tbody>
      ${state.campeonatos.map((c) => `<tr><td>${formatDate(c.data_evento)}</td><td>${escapeHtml(c.alunos?.nome || '-')}</td><td>${escapeHtml(c.nome_evento)}</td><td>${c.resultado}</td><td>${c.pontos_recebidos}</td></tr>`).join('')}
      </tbody></table>
    </div>
  `;
}

function renderCestas() {
  const totalCestas = state.cestas.filter((c) => c.tipo === 'cesta').reduce((acc, c) => acc + c.quantidade, 0);
  const totalKg = state.cestas.filter((c) => c.tipo === 'kg').reduce((acc, c) => acc + c.quantidade, 0);
  qs('sec-cestas').innerHTML = `
    <div class="card">
      <h3>Cestas / Alimentos</h3>
      <p>Total cestas: <strong>${totalCestas}</strong> · Total kg: <strong>${totalKg}</strong></p>
      <form id="form-cesta" class="grid two">
        <select name="aluno_id" required>${alunoOptions()}</select>
        <select name="tipo"><option value="kg">Alimento (kg)</option><option value="cesta">Cesta básica</option></select>
        <input name="quantidade" type="number" min="1" value="1" />
        <button type="submit">Registrar contribuição</button>
      </form>
      <table><thead><tr><th>Data</th><th>Aluno</th><th>Tipo</th><th>Qtd</th><th>Pontos</th></tr></thead><tbody>
      ${state.cestas.map((c) => `<tr><td>${formatDateTime(c.created_at)}</td><td>${escapeHtml(c.alunos?.nome || '-')}</td><td>${c.tipo}</td><td>${c.quantidade}</td><td>${c.pontos_recebidos}</td></tr>`).join('')}
      </tbody></table>
    </div>
  `;
}

function renderRecompensas() {
  qs('sec-recompensas').innerHTML = `
    <div class="card">
      <h3>Recompensas</h3>
      <form id="form-recompensa" class="grid two">
        <select name="aluno_id" required>${alunoOptions()}</select>
        <input name="item" placeholder="Item resgatado" required />
        <input name="pontos_custo" type="number" min="1" required />
        <button type="submit">Registrar resgate</button>
      </form>
      <table><thead><tr><th>Data</th><th>Aluno</th><th>Item</th><th>Custo</th></tr></thead><tbody>
      ${state.recompensas.map((r) => `<tr><td>${formatDateTime(r.created_at)}</td><td>${escapeHtml(r.alunos?.nome || '-')}</td><td>${escapeHtml(r.item)}</td><td>${r.pontos_custo}</td></tr>`).join('')}
      </tbody></table>
    </div>
  `;
}

function renderMetas() {
  qs('sec-metas').innerHTML = `
    <div class="card">
      <h3>Metas do Projeto</h3>
      <form id="form-meta" class="grid two">
        <input name="titulo" placeholder="Título" required />
        <input name="detalhe" placeholder="Detalhe" />
        <input name="atual_valor" type="number" step="0.01" placeholder="Valor atual" required />
        <input name="meta_valor" type="number" step="0.01" placeholder="Meta" required />
        <input name="ordem" type="number" placeholder="Ordem" value="0" />
        <button class="full" type="submit">Salvar meta</button>
      </form>
      ${state.metas.map((m) => `<div class="line"><span>${escapeHtml(m.titulo)} · ${escapeHtml(m.detalhe || '')}</span><span>${m.atual_valor}/${m.meta_valor}</span></div>`).join('')}
    </div>
  `;
}

function renderInscricoes() {
  qs('sec-inscricoes').innerHTML = `
    <div class="card">
      <h3>Inscrições pendentes</h3>
      <table><thead><tr><th>Nome</th><th>Contato</th><th>Dia</th><th>Ação</th></tr></thead><tbody>
      ${state.inscricoes.map((i) => `<tr><td>${escapeHtml(i.nome)}</td><td>${escapeHtml(i.whatsapp || '-')}</td><td>${escapeHtml(i.dia_preferido || '-')}</td><td><button data-converter-ins="${i.id}">Converter em aluno</button></td></tr>`).join('')}
      </tbody></table>
    </div>
  `;
}

function renderProfessores() {
  qs('sec-professores').innerHTML = `
    <div class="card">
      <h3>Professores</h3>
      <form id="form-professor" class="grid two">
        <input name="nome" placeholder="Nome" required />
        <input name="email" type="email" placeholder="E-mail" required />
        <select name="nivel"><option value="assist">Assistente</option><option value="prof">Professor</option><option value="admin">Admin</option></select>
        <input name="auth_user_id" placeholder="Auth User ID (UUID)" required />
        <button class="full" type="submit">Cadastrar professor</button>
      </form>
      ${state.professores.map((p) => `<div class="line"><span>${escapeHtml(p.nome)} · ${escapeHtml(p.email)}</span><span>${p.nivel} ${p.auth_user_id !== state.profile?.auth_user_id ? `<button data-rm-prof="${p.id}">remover</button>` : ''}</span></div>`).join('')}
    </div>
  `;
}

function renderConfiguracoes() {
  const foto = state.config.find((c) => c.chave === 'landing_foto_url')?.valor;
  qs('sec-configuracoes').innerHTML = `
    <div class="card">
      <h3>Configurações</h3>
      <form id="form-config-foto" class="grid">
        <label>Foto da landing page</label>
        <input type="file" name="foto" accept="image/*" required />
        <button type="submit">Enviar para Storage</button>
      </form>
      ${foto ? `<p><a href="${foto}" target="_blank">Visualizar foto atual da landing</a></p>` : '<p>Nenhuma foto configurada.</p>'}
    </div>
  `;
}

function renderAll() {
  renderDashboard();
  renderAlunos();
  renderRanking();
  renderPresenca();
  renderRelatorio();
  renderCalendario();
  renderPontos();
  renderDevocional();
  renderCampeonatos();
  renderCestas();
  renderRecompensas();
  renderMetas();
  renderInscricoes();
  renderProfessores();
  renderConfiguracoes();
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach((el) => el.classList.remove('active'));
  qs(`sec-${tab}`)?.classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  const id = form.id;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    if (id === 'form-aluno') {
      event.preventDefault();
      await cadastrarAluno({
        nome: data.nome,
        telefone: data.telefone || null,
        idade: data.idade ? Number(data.idade) : null,
        data_nascimento: data.data_nascimento || null,
        faixa: data.faixa,
        grau: Number(data.grau || 0),
        observacoes: data.observacoes || null
      });
      form.reset();
    }

    if (id === 'form-presenca') {
      event.preventDefault();
      const alunos = new FormData(form).getAll('alunos').map(Number);
      await salvarChamada({ dataAula: data.data_aula, tipoAula: data.tipo_aula, presentes: alunos, alunos: state.alunos });
    }

    if (id === 'form-relatorio') {
      event.preventDefault();
      const registros = await listarPresencas(data.inicio, data.fim);
      const grouped = agruparRelatorioPresenca(registros, data.aluno_id);
      const html = Object.values(grouped)
        .map((g) => {
          const total = g.presencas + g.faltas;
          const freq = total ? Math.round((g.presencas / total) * 100) : 0;
          return `<tr><td>${escapeHtml(g.nome)}</td><td>${g.presencas}</td><td>${g.faltas}</td><td>${freq}%</td></tr>`;
        })
        .join('');
      qs('output-relatorio').innerHTML = html ? `<table><thead><tr><th>Aluno</th><th>Pres.</th><th>Faltas</th><th>Freq.</th></tr></thead><tbody>${html}</tbody></table>` : '<p>Sem registros no período.</p>';
      return;
    }

    if (id === 'form-evento') {
      event.preventDefault();
      await criarEvento(data);
      form.reset();
    }

    if (id === 'form-pontos') {
      event.preventDefault();
      const pontos = Number(data.pontos || 0) || DEFAULT_POINTS[data.tipo] || 0;
      await pontuarManual({
        aluno_id: Number(data.aluno_id),
        tipo: data.tipo,
        descricao: data.descricao || null,
        pontos,
        data_evento: new Date().toISOString().slice(0, 10)
      });
      form.reset();
    }

    if (id === 'form-devocional') {
      event.preventDefault();
      await agendarDevocional({
        aluno_id: Number(data.aluno_id),
        data_devocional: data.data_devocional,
        dia_semana: data.dia_semana,
        passagem: data.passagem || null
      });
      form.reset();
    }

    if (id === 'form-campeonato') {
      event.preventDefault();
      await registrarCampeonato({
        aluno_id: Number(data.aluno_id),
        nome_evento: data.nome_evento,
        data_evento: data.data_evento,
        resultado: data.resultado
      });
      form.reset();
    }

    if (id === 'form-cesta') {
      event.preventDefault();
      await registrarCesta({
        aluno_id: Number(data.aluno_id),
        tipo: data.tipo,
        quantidade: Number(data.quantidade || 1)
      });
      form.reset();
    }

    if (id === 'form-recompensa') {
      event.preventDefault();
      await registrarRecompensa({
        aluno_id: Number(data.aluno_id),
        item: data.item,
        pontos_custo: Number(data.pontos_custo)
      });
      form.reset();
    }

    if (id === 'form-meta') {
      event.preventDefault();
      await salvarMeta({
        titulo: data.titulo,
        detalhe: data.detalhe || null,
        atual_valor: Number(data.atual_valor),
        meta_valor: Number(data.meta_valor),
        ordem: Number(data.ordem || 0),
        ativo: true
      });
      form.reset();
    }

    if (id === 'form-professor') {
      event.preventDefault();
      await criarProfessor({
        nome: data.nome,
        email: data.email,
        nivel: data.nivel,
        auth_user_id: data.auth_user_id
      });
      form.reset();
    }

    if (id === 'form-config-foto') {
      event.preventDefault();
      const file = form.foto.files[0];
      if (!file) throw new Error('Selecione uma imagem.');
      await uploadLandingImage(file);
      form.reset();
    }

    await refreshState();
    renderAll();
    toast('Operação realizada com sucesso!');
  } catch (error) {
    toast(error.message || 'Erro ao salvar dados', 'error');
  }
}

async function handleClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  try {
    const tab = target.getAttribute('data-tab');
    if (tab) {
      switchTab(tab);
      return;
    }

    const delAluno = target.getAttribute('data-del-aluno');
    if (delAluno) {
      await excluirAluno(Number(delAluno));
    }

    const editAluno = target.getAttribute('data-edit-aluno');
    if (editAluno) {
      const aluno = state.alunos.find((a) => a.id === Number(editAluno));
      if (!aluno) return;
      const nome = window.prompt('Nome', aluno.nome);
      if (!nome) return;
      const telefone = window.prompt('Telefone', aluno.telefone || '') || null;
      const faixa = window.prompt('Faixa (branca/azul/roxa/marrom/preta)', aluno.faixa) || aluno.faixa;
      await editarAluno(aluno.id, { nome, telefone, faixa });
    }

    const converter = target.getAttribute('data-converter-ins');
    if (converter) {
      const ins = state.inscricoes.find((i) => i.id === Number(converter));
      if (!ins) return;
      await cadastrarAluno({
        nome: ins.nome,
        idade: ins.idade,
        telefone: ins.whatsapp,
        faixa: 'branca',
        grau: 0,
        observacoes: 'Convertido da inscrição pública'
      });
      await atualizarInscricao(ins.id, { status: 'convertida' });
    }

    const removeProf = target.getAttribute('data-rm-prof');
    if (removeProf) {
      await removerProfessor(Number(removeProf));
    }

    if (delAluno || editAluno || converter || removeProf) {
      await refreshState();
      renderAll();
      toast('Atualização concluída!');
    }
  } catch (error) {
    toast(error.message || 'Erro na operação', 'error');
  }
}

async function handleFileUpload(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const alunoId = input.getAttribute('data-upload-aluno');
  if (!alunoId) return;
  if (!input.files?.length) return;

  try {
    await enviarFotoAluno(Number(alunoId), input.files[0]);
    await refreshState();
    renderAll();
    toast('Foto atualizada!');
  } catch (error) {
    toast(error.message || 'Erro ao enviar foto', 'error');
  }
}

async function init() {
  try {
    const auth = await requireProfessor();
    if (!auth?.profile) {
      window.location.href = './index.html';
      return;
    }

    state.profile = auth.profile;
    qs('prof-name').textContent = `${auth.profile.nome} · ${auth.profile.nivel}`;

    await refreshState();
    renderAll();
    switchTab('dashboard');

    qs('sidebar').addEventListener('click', handleClick);
    qs('panel-sections').addEventListener('click', handleClick);
    qs('panel-sections').addEventListener('submit', handleSubmit);
    qs('panel-sections').addEventListener('change', handleFileUpload);

    qs('btn-logout').addEventListener('click', async () => {
      await logout();
      window.location.href = './index.html';
    });
  } catch (error) {
    toast(error.message || 'Falha ao inicializar painel', 'error');
  }
}

init();
