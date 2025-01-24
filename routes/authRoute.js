const express = require("express");
const { param, validationResult, body } = require("express-validator");
const authController = require("../controllers/authController");
const rateLimit = require("express-rate-limit");
const cartMiddleware = require("../middlewares/cartMiddleware");

const router = express.Router();

// Middleware pour gérer les erreurs de validation
const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: errors.array()[0].msg,
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  next();
};

// Route pour soumettre l'email pour inscription
router.post(
  "/signup",
  [
    body("email")
      .notEmpty()
      .withMessage("L'email est requis.")
      .isEmail()
      .withMessage("Veuillez entrer une adresse email valide."),
  ],
  validateInputs,
  authController.signup1
);

// route pour verifier l'user qui vient sur la page de verification otp
router.get("/signup/verify/:userId", authController.verifyUser);
// Route pour vérifier l'OTP

router.post("/signup/verify/:userId", authController.verifyOtp);

// Limiteur pour restreindre les demandes de renvoi d'OTP
const resendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limite à 3 demandes par fenêtre de 10 minutes
  message: {
    status: "error",
    message:
      "Trop de demandes de renvoi d'OTP. Veuillez réessayer dans 10 minutes.",
  },
});

// Route pour renvoyer l'OTP
router.post(
  "/signup/resend-otp/:userId",
  [
    param("userId").isMongoId().withMessage("ID utilisateur invalide."),
    resendOtpLimiter, // Application du limiteur ici
  ],
  validateInputs,
  authController.resendOtp
);

// route pour verifier l'user qui vient terminer son inscription
router.get("/signup/complete/:userId", authController.verifyUser2);

// Route pour finaliser l'inscription
router.post(
  "/signup/complete/:userId",
  [
    param("userId").isMongoId().withMessage("ID utilisateur invalide."),
    body("lastname").notEmpty().withMessage("Le prenom est requis."),
    body("firstname").notEmpty().withMessage("Le nom est requis."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Les mots de passe ne correspondent pas."),
  ],
  validateInputs,
  authController.signup2
);

// route pour se connecter
router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("L'email est requis.")
      .isEmail()
      .withMessage("Veuillez entrer une adresse email valide."),
    body("password")
      .notEmpty()
      .withMessage("Le mot de passe est requis.")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  ],
  validateInputs,
  cartMiddleware,
  authController.login
);

// route pour vérifier la session
router.get("/check-session", cartMiddleware, authController.checkSession);

// route pour se deconnecter
router.post("/logout", authController.logout);

module.exports = router;
