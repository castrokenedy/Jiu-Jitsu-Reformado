import { supabase } from './supabase-config.js';

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfessorProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function requireProfessor() {
  const session = await getSession();
  if (!session) return null;
  const profile = await getProfessorProfile();
  return { session, profile };
}
