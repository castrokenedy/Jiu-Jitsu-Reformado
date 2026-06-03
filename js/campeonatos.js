import { supabase, DEFAULT_POINTS } from './supabase-config.js';

const PONTOS_RESULTADO = {
  participou: DEFAULT_POINTS.camp_participacao,
  podio: DEFAULT_POINTS.camp_podio,
  campeao: DEFAULT_POINTS.camp_podio
};

export async function listarCampeonatos() {
  const { data, error } = await supabase
    .from('campeonatos')
    .select('*, alunos(nome)')
    .order('data_evento', { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarCampeonato(payload) {
  const pontos = payload.pontos_recebidos || PONTOS_RESULTADO[payload.resultado] || DEFAULT_POINTS.camp_participacao;

  const { data, error } = await supabase
    .from('campeonatos')
    .insert({ ...payload, pontos_recebidos: pontos })
    .select()
    .single();
  if (error) throw error;

  const { error: pontosError } = await supabase.from('pontuacoes').insert({
    aluno_id: payload.aluno_id,
    tipo: 'campeonato',
    descricao: `${payload.nome_evento} (${payload.resultado})`,
    pontos,
    data_evento: payload.data_evento
  });
  if (pontosError) throw pontosError;

  return data;
}

export async function listarCestas() {
  const { data, error } = await supabase
    .from('cestas')
    .select('*, alunos(nome)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarCesta(payload) {
  const pontos = payload.tipo === 'cesta' ? payload.quantidade * DEFAULT_POINTS.cesta_basica : payload.quantidade * DEFAULT_POINTS.alimento_kg;

  const { data, error } = await supabase
    .from('cestas')
    .insert({ ...payload, pontos_recebidos: pontos })
    .select()
    .single();
  if (error) throw error;

  const { error: pontosError } = await supabase.from('pontuacoes').insert({
    aluno_id: payload.aluno_id,
    tipo: payload.tipo === 'cesta' ? 'cesta_basica' : 'alimento',
    descricao: payload.tipo === 'cesta' ? 'Montou cesta básica' : 'Juntou alimento (kg)',
    pontos,
    data_evento: new Date().toISOString().slice(0, 10)
  });
  if (pontosError) throw pontosError;

  return data;
}

export async function listarRecompensas() {
  const { data, error } = await supabase
    .from('recompensas')
    .select('*, alunos(nome)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarRecompensa(payload) {
  const { data, error } = await supabase.from('recompensas').insert(payload).select().single();
  if (error) throw error;

  const { error: pontosError } = await supabase.from('pontuacoes').insert({
    aluno_id: payload.aluno_id,
    tipo: 'resgate',
    descricao: `Resgate: ${payload.item}`,
    pontos: -Math.abs(payload.pontos_custo),
    data_evento: new Date().toISOString().slice(0, 10)
  });

  if (pontosError) throw pontosError;
  return data;
}

export async function listarEventos() {
  const { data, error } = await supabase.from('eventos').select('*').order('data_evento');
  if (error) throw error;
  return data;
}

export async function criarEvento(payload) {
  const { data, error } = await supabase.from('eventos').insert(payload).select().single();
  if (error) throw error;
  return data;
}
