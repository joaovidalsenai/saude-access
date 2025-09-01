import supabase from "./supabaseClient.js";

const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies['sb-access-token'];

    // Se não há token, o usuário não está logado. Redireciona para o login.
    if (!accessToken) {
      return res.redirect('/login');
    }

    // Verifica com o Supabase se o token é válido
    const { error } = await supabase.auth.getUser(accessToken);

    if (error) {
      // Se o token for inválido (expirado, etc.), limpa os cookies e redireciona
      res.clearCookie('sb-access-token');
      res.clearCookie('sb-refresh-token');
      return res.redirect('/login');
    }

    // Se o token for válido, a requisição pode prosseguir para a rota protegida
    next();
  } catch (error) {
    return res.redirect('/login');
  }
};

export default protectRoute;