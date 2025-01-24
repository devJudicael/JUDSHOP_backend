const Order = require("../models/orderModal");

exports.postOrder = async (req, res) => {
  try {
    const {
      status,
      articles,
      infoUser,
      totalAmount,
      numberOfItems,
      date,
      hour,
    } = req.body;

    const userId = req.user?.userId;

    // Vérifier si l'utilisateur est authentifié
    if (!userId) {
      return res.status(401).json({
        status: "echec",
        message: "Utilisateur non authentifié",
      });
    }

    // fonction pour generer un uuid
    const generateUniqueId = async () => {
      let uniqueId;
      let exists = true;

      while (exists) {
        // Générer un nombre aléatoire entre 1000 et 9999 (ou ajustez la plage selon vos besoins)
        uniqueId = Math.floor(Math.random() * 90000) + 1000; // Génère un nombre entre 1000 et 99999

        // Vérifiez si cet ID existe déjà dans la base de données
        const orderExists = await Order.findOne({ uuid: uniqueId });
        exists = orderExists !== null;
      }

      return uniqueId;
    };

    // Générer un UUID unique pour la commande
    const uuid = await generateUniqueId();

    // Créer une nouvelle instance de commande avec les données reçues
    const newOrder = new Order({
      userId,
      uuid,
      status,
      articles,
      infoUser,
      totalAmount,
      numberOfItems,
      date,
      hour,
    });

    // Enregistrer la commande dans la base de données
    const savedOrder = await newOrder.save();

    // Renvoyer la commande enregistrée en réponse avec un statut de succès
    res.status(201).json({
      status: "success",
      message: "Commande créée avec succès",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la commande :", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'ajout de la commande",
      error: error.message,
    });
  }
};

exports.fetchOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: "pas autorisé",
        message: "Utilisateur non authentifié",
      });
    }

    // Récupérer les commandes pour l'utilisateur spécifique
    const orders = await Order.find({ userId });

    res.status(200).json({
      status: "success",
      message: "Commandes récupérées avec succès",
      orders,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(404).json({
      status: "error",
      message: "Une erreur est survenue",
      error: error.message,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    // Récupérer l'ID de la commande depuis les paramètres de la requête
    const orderId = req.params.idOrder;

    // Rechercher la commande correspondante dans la base de données
    const order = await Order.findById(orderId);

    // Si la commande n'est pas trouvée, renvoyer une erreur 404
    if (!order) {
      return res.status(404).json({
        status: "echec",
        message: "Commande introuvable",
      });
    }

    // Si la commande est trouvée, renvoyer la commande avec un statut 200
    res.status(200).json({
      status: "succès",
      message: "Commande récupérée avec succès",
      order,
    });
  } catch (error) {
    // En cas d'erreur, renvoyer un message d'erreur avec un statut 500
    console.error("Erreur lors de la récupération de la commande :", error);
    res.status(500).json({
      status: "erreur",
      message: "Erreur lors de la récupération de la commande",
      error: error.message,
    });
  }
};
