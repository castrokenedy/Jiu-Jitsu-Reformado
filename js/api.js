import { supabase } from './supabase-config.js';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function loginByUsername(userLogin, password) {
  let prof = null;
  let profError = null;

  const { data, error } = await supabase
    .from('professores')
    .select('id,nome,nivel,email,user_login,auth_user_id')
    .eq('email', userLogin)
    .eq('ativo', true)
    .maybeSingle();
  prof = data;
  profError = error;

  if (!prof && !userLogin.includes('@')) {
    const { data: byUser, error: byUserError } = await supabase
      .from('professores')
      .select('id,nome,nivel,email,user_login,auth_user_id')
      .eq('user_login', userLogin)
      .eq('ativo', true)
      .maybeSingle();
    if (!byUserError) {
      prof = byUser;
    }
  }

  if (profError) throw profError;
  if (!prof || !prof.email) throw new Error('Usuário não encontrado.');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: prof.email,
    password
  });
  if (authError) throw authError;

  const { data: updatedProf } = await supabase
    .from('professores')
    .select('*')
    .eq('email', prof.email)
    .maybeSingle();

  return { session: authData.session, professor: updatedProf || prof };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfessorProfileBySession() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .eq('ativo', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function syncProfessorAuthUserByEmail(authUserId, email) {
  const { error } = await supabase
    .from('professores')
    .update({ auth_user_id: authUserId })
    .eq('email', email)
    .is('auth_user_id', null);
  if (error) throw error;
}

export async function listPublicData() {
  let alunosRes = await supabase.from('alunos').select('*').eq('ativo', true).order('pontos', { ascending: false });
  if (alunosRes.error && alunosRes.error.message?.includes('column') && alunosRes.error.message.includes('pontos')) {
    alunosRes = await supabase.from('alunos').select('*').eq('ativo', true).order('id', { ascending: false });
  }

  const [metasRes, cfgRes] = await Promise.all([
    supabase.from('metas').select('*').order('ordem', { ascending: true }),
    supabase.from('configuracoes').select('*')
  ]);

  if (alunosRes.error) throw alunosRes.error;
  if (metasRes.error) throw metasRes.error;
  if (cfgRes.error) throw cfgRes.error;

  return { alunos: alunosRes.data || [], metas: metasRes.data || [], config: cfgRes.data || [] };
}

export async function listPainelData() {
  const queries = await Promise.all([
    supabase.from('alunos').select('*').eq('ativo', true).order('nome'),
    supabase.from('devocionais').select('*').order('data', { ascending: true }),
    supabase.from('campeonatos').select('*').order('id', { ascending: false }),
    supabase.from('cestas').select('*').order('id', { ascending: false }),
    supabase.from('inscricoes').select('*').order('id', { ascending: false }),
    supabase.from('recompensas').select('*').order('id', { ascending: false }),
    supabase.from('metas').select('*').order('ordem', { ascending: true }),
    supabase.from('professores').select('*').eq('ativo', true).order('id'),
    supabase.from('eventos').select('*').order('data', { ascending: true }),
    supabase.from('presenca_log').select('*').order('id', { ascending: false }),
    supabase.from('configuracoes').select('*')
  ]);

  const keys = ['alunos', 'devocionais', 'campeonatos', 'cestas', 'inscricoes', 'recompensas', 'metas', 'professores', 'eventos', 'presencaLog', 'config'];
  const out = {};
  queries.forEach((q, idx) => {
    if (q.error) throw q.error;
    out[keys[idx]] = q.data || [];
  });
  return out;
}

export async function createInscricao(payload) {
  const { error } = await supabase.from('inscricoes').insert(payload);
  if (error) throw error;
}

export async function createAluno(payload) {
  const { data, error } = await supabase.from('alunos').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateAluno(id, payload) {
  const { data, error } = await supabase.from('alunos').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deactivateAluno(id) {
  const { error } = await supabase.from('alunos').update({ ativo: false }).eq('id', id);
  if (error) throw error;
}

export async function createDevocional(payload) {
  const { error } = await supabase.from('devocionais').insert(payload);
  if (error) throw error;
}

export async function createCampeonato(payload) {
  const { error } = await supabase.from('campeonatos').insert(payload);
  if (error) throw error;
}

export async function createCesta(payload) {
  const { error } = await supabase.from('cestas').insert(payload);
  if (error) throw error;
}

export async function createRecompensa(payload) {
  const { error } = await supabase.from('recompensas').insert(payload);
  if (error) throw error;
}

export async function createEvento(payload) {
  const { error } = await supabase.from('eventos').insert(payload);
  if (error) throw error;
}

export async function saveMeta(payload) {
  const { error } = await supabase.from('metas').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function createProfessor(payload) {
  const { error } = await supabase.from('professores').insert(payload);
  if (error) throw error;
}

export async function createProfessorWithAuth(userLogin, password, nome, nivel) {
  const email = `${userLogin}@trocar-email.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  if (authError) throw authError;

  const insertPayload = {
    nome,
    user_login: userLogin,
    email,
    nivel,
    ativo: true
  };
  if (authData?.user?.id) insertPayload.auth_user_id = authData.user.id;

  try {
    const { data, error } = await supabase.from('professores').insert(insertPayload).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    const msg = error?.message || '';
    if (msg.includes('user_login') || msg.includes('column') && msg.includes('user_login')) {
      delete insertPayload.user_login;
      const { data, error: retryError } = await supabase.from('professores').insert(insertPayload).select().single();
      if (retryError) throw retryError;
      return data;
    }
    throw error;
  }
}

export async function removeProfessor(id) {
  const { error } = await supabase.from('professores').update({ ativo: false }).eq('id', id);
  if (error) throw error;
}

export async function updateInscricaoStatus(id, status) {
  const { error } = await supabase.from('inscricoes').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function insertPresencaLogs(records) {
  if (!records.length) return;
  const { error } = await supabase.from('presenca_log').insert(records);
  if (error) throw error;
}

export async function saveConfig(chave, valor) {
  const { error } = await supabase.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' });
  if (error) throw error;
}

export async function uploadAlunoFoto(alunoId, file) {
  const ext = file.name.split('.').pop();
  const path = `alunos/${alunoId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('alunos-fotos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('alunos-fotos').getPublicUrl(path);
  await updateAluno(alunoId, { foto: data.publicUrl });
  return data.publicUrl;
}

export async function uploadLandingFoto(file) {
  const ext = file.name.split('.').pop();
  const path = `landing/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('alunos-fotos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('alunos-fotos').getPublicUrl(path);
  await saveConfig('landing_foto_url', data.publicUrl);
  return data.publicUrl;
}
