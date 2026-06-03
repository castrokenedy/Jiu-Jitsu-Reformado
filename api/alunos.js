import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Configurações de CORS para segurança de requisições
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 1. LISTAR ALUNOS (GET) - Alimenta a lista do painel e o ranking
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('ativo', true)
      .order('pontos', { ascending: false }); // Já traz ordenado para o ranking!

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // 2. CADASTRAR ALUNO (POST) - Quando o professor adiciona um novo atleta
  if (req.method === 'POST') {
    const { nome, faixa, graus } = req.body;

    if (!nome || !faixa) {
      return res.status(400).json({ error: 'Nome e faixa são obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('alunos')
      .insert([{ nome, faixa, graus: graus || 0, frequencia: 0, pontos: 0 }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, data });
  }

  // 3. ATUALIZAR DADOS (PUT) - Para chamadas de Presença, Pontos ou Graduação
  if (req.method === 'PUT') {
    const { id, frequencia, pontos, faixa, graus, historico_presencas } = req.body;

    if (!id) return res.status(400).json({ error: 'ID do aluno é necessário.' });

    // Monta o objeto dinamicamente apenas com o que foi enviado na requisição
    const camposAtualizados = {};
    if (frequencia !== undefined) camposAtualizados.frequencia = frequencia;
    if (pontos !== undefined) camposAtualizados.pontos = pontos;
    if (faixa !== undefined) camposAtualizados.faixa = faixa;
    if (graus !== undefined) camposAtualizados.graus = graus;
    if (historico_presencas !== undefined) camposAtualizados.historico_presencas = historico_presencas;

    const { data, error } = await supabase
      .from('alunos')
      .update(camposAtualizados)
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, data });
  }

  // Caso use exclusão lógica (desativar aluno)
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { data, error } = await supabase
      .from('alunos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Aluno desativado.' });
  }

  return res.status(405).json({ message: 'Método não permitido' });
}