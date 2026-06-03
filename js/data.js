import { supabase } from './supabase-config.js';

export async function listarPontuacoes(limit = 100) {
  const { data, error } = await supabase
    .from('pontuacoes')
    .select('*, alunos(nome)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function pontuarManual(payload) {
  const { data, error } = await supabase.from('pontuacoes').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function listarMetas() {
  const { data, error } = await supabase.from('metas').select('*').eq('ativo', true).order('ordem');
  if (error) throw error;
  return data;
}

export async function salvarMeta(payload) {
  const { data, error } = await supabase.from('metas').upsert(payload).select();
  if (error) throw error;
  return data;
}

export async function listarInscricoes(status = null) {
  let query = supabase.from('inscricoes').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function criarInscricao(payload) {
  const { data, error } = await supabase.from('inscricoes').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarInscricao(id, payload) {
  const { data, error } = await supabase.from('inscricoes').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function listarProfessores() {
  const { data, error } = await supabase.from('professores').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function criarProfessor(payload) {
  const { data, error } = await supabase.from('professores').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function removerProfessor(id) {
  const { error } = await supabase.from('professores').delete().eq('id', id);
  if (error) throw error;
}

export async function listarConfiguracoes() {
  const { data, error } = await supabase.from('configuracoes').select('*');
  if (error) throw error;
  return data;
}

export async function salvarConfiguracao(chave, valor) {
  const { data, error } = await supabase
    .from('configuracoes')
    .upsert({ chave, valor }, { onConflict: 'chave' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadLandingImage(file) {
  const extension = file.name.split('.').pop();
  const path = `landing/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('alunos-fotos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('alunos-fotos').getPublicUrl(path);
  await salvarConfiguracao('landing_foto_url', data.publicUrl);
  return data.publicUrl;
}
