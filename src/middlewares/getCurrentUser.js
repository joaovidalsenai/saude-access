import supabase from '../db/supabase.js';

// Tenta extrair o usuário atual do cookie e retorna { user, error }
export async function getCurrentUser(req) {
  const token = req.cookies['sb-access-token'];
  if (!token) {
    return { user: null, error: new Error('Token não fornecido') };
  }

  const { data, error } = await supabase.auth.getUser(token);
  return { user: data?.user ?? null, error };
}

export default getCurrentUser;