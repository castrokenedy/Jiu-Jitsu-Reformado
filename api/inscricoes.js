import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase com as variáveis de ambiente da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Configura CORS se necessário
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'POST') {
    // Salvar inscrição enviada pelo formulário público
    const { nome, tel, idade, dia, exp, como, obs } = req.body;
    
    const { data, error } = await supabase
      .from('inscricoes')
      .insert([{ nome, tel, idade, dia, exp, como, obs }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, data });
  }

  if (req.method === 'GET') {
    // Listar as inscrições (para a parte do painel do professor)
    const { data, error } = await supabase
      .from('inscricoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}