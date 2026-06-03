export const SUPABASE_URL = 'https://bzecfmvdbbsrmhbphayq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZWNmbXZkYmJzcm1oYnBoYXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MzczNDUsImV4cCI6MjA5NjAxMzM0NX0._b_8zPw_7asr9FKwpddtUzJTagGSNcQobkPkWeDspII';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const BELT_LABELS = {
  branca: 'Branca',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta'
};

export const DEFAULT_POINTS = {
  presenca: 5,
  devocional: 3,
  visitante: 10,
  camp_participacao: 8,
  camp_podio: 20,
  alimento_kg: 5,
  cesta_basica: 15,
  especial: 2
};
