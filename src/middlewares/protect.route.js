import supabase from "../db/supabase.js";

// A centralized error handler to avoid repetition
const handleAuthError = (res) => {
  res.clearCookie('sb-access-token');
  res.clearCookie('sb-refresh-token');
  return res.redirect('/login');
};

// Core authentication logic
const authenticateUser = async (req, res, next) => {
  try {
    const accessToken = req.cookies['sb-access-token'];

    if (!accessToken) {
      return handleAuthError(res);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return handleAuthError(res);
    }

    // Attach user object to the request for later use in other routes/middlewares
    req.user = user;
    next();
  } catch (error) {
    // Catch any unexpected errors during authentication
    return handleAuthError(res);
  }
};

// Specific authorization logic for "entire" protection
const authorizeFullAccess = (req, res, next) => {
  // This middleware assumes `authenticateUser` has already run and attached `req.user`
  if (req.user?.user_metadata?.full_user_access !== true) {
    return res.redirect('/cadastro/info');
  }
  next();
};

const protect = {
  // `partially` is just the core authentication
  partially: authenticateUser,

  // `entirely` is authentication AND the specific authorization check
  entirely: [authenticateUser, authorizeFullAccess],
};

export default protect;