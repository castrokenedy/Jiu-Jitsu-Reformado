import { supabase, DEFAULT_POINTS } from './supabase-config.js';

export async function listarDevocionais() {
  const { data, error } = await supabase
    .from('devocionais')
    .select('*, alunos(nome)')
    .order('data_devocional');
  if (error) throw error;
  return data;
}

export async function agendarDevocional(payload) {
  const { data, error } = await supabase.from('devocionais').insert(payload).select().single();
  if (error) throw error;

  const { error: pontosError } = await supabase.from('pontuacoes').insert({
    aluno_id: payload.aluno_id,
    tipo: 'devocional',
    descricao: payload.passagem ? `Devocional: ${payload.passagem}` : 'Ministrou devocional',
    pontos: DEFAULT_POINTS.devocional,
    data_evento: payload.data_devocional
  });

  if (pontosError) throw pontosError;
  return data;
}
