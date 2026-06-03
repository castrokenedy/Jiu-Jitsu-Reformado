import { supabase } from './supabase-config.js';

export async function listarAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data;
}

export async function cadastrarAluno(payload) {
  const { data, error } = await supabase.from('alunos').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function editarAluno(id, payload) {
  const { data, error } = await supabase.from('alunos').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function excluirAluno(id) {
  const { error } = await supabase.from('alunos').update({ ativo: false }).eq('id', id);
  if (error) throw error;
}

export async function enviarFotoAluno(alunoId, file) {
  const extension = file.name.split('.').pop();
  const path = `alunos/${alunoId}/${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('alunos-fotos').upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('alunos-fotos').getPublicUrl(path);
  await editarAluno(alunoId, { foto_url: data.publicUrl });
  return data.publicUrl;
}

export async function listarRanking(limit = 100) {
  const { data, error } = await supabase
    .from('alunos')
    .select('id,nome,faixa,grau,pontos_total,foto_url,presencas,faltas,telefone')
    .eq('ativo', true)
    .order('pontos_total', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function listarAniversariosProximos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('id,nome,data_nascimento,telefone,idade')
    .eq('ativo', true)
    .not('data_nascimento', 'is', null);
  if (error) throw error;

  const now = new Date();
  const max = new Date();
  max.setDate(now.getDate() + 7);

  return data
    .map((a) => {
      const date = new Date(a.data_nascimento);
      const check = new Date(now.getFullYear(), date.getMonth(), date.getDate());
      return { ...a, aniversario: check };
    })
    .filter((a) => a.aniversario >= now && a.aniversario <= max)
    .sort((a, b) => a.aniversario - b.aniversario);
}
