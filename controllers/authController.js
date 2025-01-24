const mongoose = require("mongoose");
const User = require("../models/userModel");
const sgMail = require("@sendgrid/mail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Inscription - étape 1 : soumission de l'email pour recevoir l'OTP
exports.signup1 = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    if (user) {
      if (!user.isVerified) {
        // Vérifiez si l'OTP est encore valide
        if (user.otpExpiresAt > new Date()) {
          return res.status(400).json({
            status: "error",
            message:
              "Un OTP a déjà été envoyé. Veuillez vérifier votre email ou attendez 10 minutes.",
            errorCode: "OTP_ALREADY_SENT",
          });
        }
        user.otpCode = otpCode;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();
      } else {
        return res.status(400).json({
          status: "error",
          message: "L'utilisateur existe déjà.",
          errorCode: "USER_ALREADY_EXISTS",
        });
      }
    } else {
      user = new User({ email, otpCode, otpExpiresAt });
      await user.save();
    }

    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: "Vérification de l'email",
      html: `<h3>KYLIANSHOP</h3><br><p>Voici votre code de vérification : <strong>${otpCode}</strong></p><p>Ce code expire dans 5 minutes.</p>`,
    };
    await sgMail.send(msg);

    return res.status(200).json({
      status: "success",
      message: "OTP envoyé par email.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message:
        err.message || "Une erreur s'est produite lors de l'inscription.",
      errorCode: "SIGNUP_ERROR",
    });
  }
};

// verification de l'user par son id
exports.verifyUser = async (req, res) => {
  const { userId } = req.params;

  // Vérifiez si l'identifiant est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status: "error",
      message: "Identifiant utilisateur invalide.",
      errorCode: "INVALID_USER_ID",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user || !userId || user.isVerified) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Utilisateur trouvé.",
      userId: user._id,
      mail: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la vérification de l'utilisateur.",
      errorCode: "VERIFY_USER_ERROR",
    });
  }
};

// verification de l'user par son id
exports.verifyUser2 = async (req, res) => {
  const { userId } = req.params;

  // Vérifiez si l'identifiant est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status: "error",
      message: "Identifiant utilisateur invalide.",
      errorCode: "INVALID_USER_ID",
    });
  }

  try {
    const user = await User.findById(userId);
    console.log(user);

    if (!user || !userId || !user.isVerified || user.password) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Utilisateur trouvé.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la vérification de l'utilisateur.",
      errorCode: "VERIFY_USER_ERROR",
    });
  }
};

// Vérification de l'OTP
exports.verifyOtp = async (req, res) => {
  const { userId } = req.params;
  const { otp } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé.",
        errorCode: "USER_NOT_FOUND",
      });
    }
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Code OTP expiré.",
        errorCode: "OTP_EXPIRED",
      });
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Code OTP incorrect.",
        errorCode: "INVALID_OTP",
      });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Vérification réussie.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la vérification.",
      errorCode: "VERIFICATION_ERROR",
    });
  }
};

// Renvoi de l'OTP
exports.resendOtp = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    // Générer un nouvel OTP et une nouvelle date d'expiration
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = newOtpCode;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes d'expiration

    await user.save();

    const msg = {
      to: user.email,
      from: process.env.EMAIL_SENDER,
      subject: "Renvoyer votre code de vérification",
      html: `<h3>KYLIANSHOP</h3><br><p>Voici votre nouveau code de vérification : <strong>${newOtpCode}</strong></p><p>Ce code expire dans 5 minutes.</p>`,
    };
    await sgMail.send(msg);

    return res.status(200).json({
      status: "success",
      message: "Nouvel OTP envoyé par email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors du renvoi de l'OTP.",
      errorCode: "RESEND_OTP_ERROR",
    });
  }
};

// Inscription - étape 2 : finalisation de l'inscription avec mot de passe
exports.signup2 = async (req, res) => {
  const { userId } = req.params;
  const { firstname, lastname, password } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    // Vérifiez si l'utilisateur a déjà complété son inscription
    if (user.isVerified && user.firstName && user.lastName && user.password) {
      return res.status(400).json({
        status: "error",
        message: "L'utilisateur a déjà terminé son inscription.",
        errorCode: "USER_ALREADY_REGISTERED",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez d'abord vérifier votre email.",
        errorCode: "EMAIL_NOT_VERIFIED",
      });
    }

    // Enregistrer les informations de l'utilisateur
    user.firstName = firstname;
    user.lastName = lastname;
    user.password = password;

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Inscription réussie et connexion automatique",

      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de l'inscription.",
      errorCode: "SIGNUP_COMPLETION_ERROR",
    });
  }
};

// Connexion - contrôleur de login
exports.login = async (req, res) => {
  let token;
  const { anonymousId } = req.user || {};

  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe et est vérifié
    const user = await User.findOne({ email, isVerified: true });
    if (!user || !user.password) {
      return res.status(404).json({
        status: "error",
        message: "Utilisateur non trouvé.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    // Vérifier si le mot de passe correspond
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Mot de passe incorrect.",
        errorCode: "INVALID_PASSWORD",
      });
    }

    if (!anonymousId) {
      token = jwt.sign(
        { userId: user._id, email: user.email },

        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
    } else {
      token = jwt.sign(
        { userId: user._id, email: user.email, anonymousId },

        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
    }

    // Retourner le statut de connexion et des informations utilisateur non sensibles
    return res.status(200).json({
      status: "success",
      message: "Connexion réussie.",
      userId: user._id,
      email: user.email,
      token: token,
      // d'autres informations utilisateur non sensibles si nécessaire
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite lors de la connexion.",
      errorCode: "LOGIN_ERROR",
    });
  }
};

// Vérifier la session
exports.checkSession = (req, res) => {
  const { userId } = req.user || {};

  if (!userId) {
    return res
      .status(200)
      .json({ status: "error", message: "Non authentifié" });
  }

  try {
    res.status(200).json({
      status: "success",

      user: { userId },
    });
  } catch (error) {
    res.status(401).json({ status: "error", message: "Session expirée" });
  }
};

// Deconnexion

exports.logout = (req, res) => {
  try {
    return res.status(200).json({
      status: "success",
      message: "Déconnexion réussie.",
    });
  } catch (err) {
    console.error("Erreur lors de la déconnexion :", err);
    return res.status(500).json({
      status: "error",
      message: "Erreur lors de la déconnexion.",
    });
  }
};
