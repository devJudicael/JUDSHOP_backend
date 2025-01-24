const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  // Récupérer le token depuis le cookie
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Accès non autorisé. Aucun token fourni.",
      errorCode: "NO_TOKEN_PROVIDED",
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ajouter les informations utilisateur à la requête

    next(); // Continuer vers la route suivante
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Token invalide ou expiré.",
      errorCode: "INVALID_TOKEN",
    });
  }
};

module.exports = authenticateUser;
