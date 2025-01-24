const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]; // Extraire le token du header

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Assigner les informations utilisateur ou anonyme au req.user
    } catch (err) {
      console.warn("Token invalide ou expiré, accès en tant qu'invité.");
    }
  }

  next(); // Continue sans bloquer l'accès même si l'utilisateur n'est pas authentifié
};

module.exports = optionalAuth;
