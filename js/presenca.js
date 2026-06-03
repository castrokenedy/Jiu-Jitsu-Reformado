import { supabase, DEFAULT_POINTS } from './supabase-config.js';

export async function salvarChamada({ dataAula, tipoAula, presentes, alunos }) {
  const registros = alunos.map((aluno) => ({
    aluno_id: aluno.id,
    data_aula: dataAula,
    tipo_aula: tipoAula,
    presente: presentes.includes(aluno.id)
  }));

  const { error: presencaError } = await supabase
    .from('presencas')
    .upsert(registros, { onConflict: 'aluno_id,data_aula,tipo_aula' });

  if (presencaError) throw presencaError;

  const pontuacoes = presentes.map((alunoId) => ({
    aluno_id: alunoId,
    tipo: 'presenca',
    descricao: 'Presença em aula',
    pontos: DEFAULT_POINTS.presenca,
    data_evento: dataAula
  }));

  if (pontuacoes.length) {
    const { error: pontosError } = await supabase.from('pontuacoes').insert(pontuacoes);
    if (pontosError) throw pontosError;
  }
}

export async function listarPresencas(inicio, fim) {
  let query = supabase
    .from('presencas')
    .select('*, alunos(nome)')
    .order('data_aula', { ascending: false });

  if (inicio) query = query.gte('data_aula', inicio);
  if (fim) query = query.lte('data_aula', fim);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export function agruparRelatorioPresenca(registros, alunoId = '') {
  const filtered = alunoId ? registros.filter((r) => String(r.aluno_id) === String(alunoId)) : registros;

  return filtered.reduce((acc, item) => {
    if (!acc[item.aluno_id]) {
      acc[item.aluno_id] = { nome: item.alunos?.nome || '-', presencas: 0, faltas: 0 };
    }
    if (item.presente) acc[item.aluno_id].presencas += 1;
    else acc[item.aluno_id].faltas += 1;
    return acc;
  }, {});
}
