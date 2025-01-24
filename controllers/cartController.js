const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// Récupérer le panier

exports.getCart = async (req, res) => {
  let cart;

  // Récupérer userId ou anonymousId depuis req.user (selon l'authentification)
  const { userId, anonymousId } = req.user || {};

  // Construire dynamiquement la requête en fonction de la présence de userId ou anonymousId
  const query = {};
  if (userId) query.userId = userId; // Si userId est présent, chercher le panier de l'utilisateur connecté
  if (anonymousId) query.anonymousId = anonymousId; // Si anonymousId est présent, chercher le panier anonyme

  try {
    // Si ni userId ni anonymousId, retourner un panier vide
    if (!userId && !anonymousId) {
      return res.status(200).json({
        status: "success",
        cart: { items: [], totalAmount: 0, numberOfItems: 0 },
        message:
          "Panier vide récupéré avec succès, utilisateur non authentifié",
      });
    }

    // Chercher le panier correspondant à userId ou anonymousId
    cart = await Cart.findOne(query);

    // Si aucun panier trouvé, créer un panier vide par défaut
    if (!cart) {
      cart = {
        items: [],
        totalAmount: 0,
        numberOfItems: 0,
      };
    }

    // Retourner le panier
    res.status(200).json({
      status: "success",
      cart,
      message: "Panier récupéré avec succès",
    });
  } catch (error) {
    // En cas d'erreur serveur, retourner un message d'erreur
    res.status(500).json({ message: error.message });
  }
};

// Ajouter un produit au panier
exports.addToCart = async (req, res) => {
  console.log(process.env.NODE_ENV);

  const { productId } = req.body;

  // Récupérer userId ou anonymousId depuis le token
  let { userId, anonymousId } = req.user || {}; // De préférence, utilisez toujours 'anonymousId'
  let token;

  console.log("userId dans addToCart: ", userId);
  console.log("anonymousId dans addToCart: ", anonymousId);

  // Générer un nouvel anonymousId si aucun ID n'est disponible
  if (!anonymousId && !userId) {
    console.log("aucun des deux ----");

    // Générer un ID unique pour l'utilisateur anonyme
    anonymousId = new mongoose.Types.ObjectId(); // Utilisez la même variable 'anonymousId' pour l'ID généré
    // Créer le token pour l'utilisateur anonyme avec l'anonymousId (pas besoin de cookie)
    token = jwt.sign({ anonymousId }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
  }

  const query = {};
  if (userId) query.userId = userId;
  if (anonymousId) query.anonymousId = anonymousId; // Utilisez 'anonymousId' partout pour plus de cohérence

  try {
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Produit non trouvé" });

    const { price } = product;

    // Récupérer le panier soit à partir de userId ou anonymousId
    let cart = await Cart.findOne(query);

    if (!cart) {
      // Créer un panier si aucun panier n'est trouvé
      cart = new Cart({
        userId,
        anonymousId, // Utilisez 'anonymousId' ici aussi
        items: [],
        totalAmount: 0,
        numberOfItems: 0,
      });
    }

    // Vérifier si le produit existe déjà dans le panier
    const existingItemIndex = cart.items.findIndex((item) =>
      item.productId.equals(productId)
    );

    if (existingItemIndex > -1) {
      // Si le produit existe déjà, augmenter la quantité
      cart.items[existingItemIndex].qty += 1;
    } else {
      // Sinon, ajouter le produit au panier
      cart.items.push({
        productId,
        image: product.image,
        name: product.name,
        price,
        qty: 1,
      });
    }

    // Mettre à jour le montant total et le nombre d'articles
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );
    cart.numberOfItems = cart.items.reduce(
      (count, item) => count + item.qty,
      0
    );

    // Sauvegarder le panier dans la base de données
    await cart.save();

    res.status(200).json({
      status: "success",
      cart,
      message: "Produit ajouté au panier",
      token, // Renvoyer le token si un nouveau panier a été créé
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retirer un produit du panier
exports.removeFromCart = async (req, res) => {
  const { productId } = req.body;

  // Vérifier si req.user existe pour récupérer userId ou anonymousId
  let { userId, anonymousId } = req.user || {};

  console.log("userId dans remove: ", userId);
  console.log("anonymousId dans remove: ", anonymousId);

  // Créer une query en fonction de l'ID utilisateur ou anonyme
  const query = {};
  if (userId) query.userId = userId;
  if (anonymousId) query.anonymousId = anonymousId;

  try {
    // Récupérer le panier de l'utilisateur (ou anonyme)
    const cart = await Cart.findOne(query);

    if (!cart) {
      // Si aucun panier n'est trouvé
      return res.status(404).json({ message: "Panier non trouvé" });
    }

    // Chercher l'index du produit à retirer
    const itemIndex = cart.items.findIndex((item) =>
      item.productId.equals(productId)
    );

    if (itemIndex > -1) {
      // Si l'article est trouvé dans le panier
      const item = cart.items[itemIndex];

      if (item.qty > 1) {
        // Si la quantité est supérieure à 1, réduire la quantité
        item.qty--;
        cart.totalAmount -= item.price;
        cart.numberOfItems--;
      } else {
        // Si la quantité est égale à 1, supprimer l'article du panier
        cart.totalAmount -= item.price;
        cart.numberOfItems--;
        cart.items.splice(itemIndex, 1);
      }

      // Mettre à jour le panier après modification
      await cart.save();

      res.status(200).json({
        status: "success",
        cart,
        message: "Produit retiré du panier",
      });
    } else {
      // Si l'article n'est pas trouvé dans le panier
      res.status(404).json({ message: "Article non trouvé dans le panier" });
    }
  } catch (error) {
    console.error("Erreur dans removeFromCart : ", error);
    res.status(500).json({ message: "Erreur serveur : " + error.message });
  }
};

// Supprimer complètement un produit du panier
exports.deleteFromCart = async (req, res) => {
  const { productId } = req.body;

  // Récupérer userId ou anonymousId depuis le token JWT
  let { userId, anonymousId } = req.user || {};

  console.log("userId dans remove: ", userId);
  console.log("anonymousId dans remove: ", anonymousId);

  const query = {};
  if (userId) query.userId = userId;
  if (anonymousId) query.anonymousId = anonymousId;

  try {
    const cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ message: "Panier non trouvé" });

    const itemIndex = cart.items.findIndex((item) =>
      item.productId.equals(productId)
    );

    if (itemIndex > -1) {
      const item = cart.items[itemIndex];
      cart.totalAmount -= item.price * item.qty;
      cart.numberOfItems -= item.qty;
      cart.items.splice(itemIndex, 1);

      await cart.save();
      res.status(200).json({
        status: "success",
        cart,
        message: "Produit supprimé du panier",
      });
    } else {
      res.status(404).json({ message: "Article non trouvé dans le panier" });
    }
  } catch (error) {
    console.error("Erreur dans deleteFromCart : ", error);
    res.status(500).json({ message: error.message });
  }
};

// Réinitialiser le panier
exports.resetCart = async (req, res) => {
  // Récupérer userId ou anonymousId depuis le token JWT
  let { userId, anonymousId } = req.user || {};

  console.log("userId dans resetCart: ", userId);
  console.log("anonymousId dans resetCart: ", anonymousId);

  const query = {};
  if (userId) query.userId = userId;
  if (anonymousId) query.anonymousId = anonymousId;

  try {
    console.log(query);

    // Tente de trouver et de supprimer le panier correspondant
    const deletedCart = await Cart.findOneAndDelete(query);

    // Si aucun panier n'est trouvé, renvoyer une réponse indiquant que le panier est déjà vide
    if (!deletedCart) {
      console.log("Aucun panier à reset");

      return res.status(200).json({
        status: "success",
        message: "Aucun panier à réinitialiser",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Panier réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur dans resetCart : ", error);
    res.status(500).json({ message: error.message });
  }
};

// Fusionner le panier lors de la connexion
exports.mergeCartOnLogin = async (req, res) => {
  // Récupérer userId ou anonymousId depuis le token JWT
  let { userId, anonymousId } = req.user || {};

  // Vérifier si l'utilisateur est connecté
  if (!userId) {
    return res.status(200).json({ message: "Utilisateur pas connecté" });
  }

  // Vérifier si un panier anonyme existe
  if (!anonymousId) {
    return res.status(200).json({ message: "Pas de panier à fusionner" });
  }

  try {
    // Créer un objet query pour chercher les paniers
    const query = {};
    if (userId) query.userId = userId;
    if (anonymousId) query.anonymousId = anonymousId;

    // Récupérer les deux paniers en fonction de l'objet query
    let cart = await Cart.findOne({ userId });
    const anonymousCart = await Cart.findOne({ anonymousId });

    if (!anonymousCart) {
      return res.status(200).json({ message: "Pas de panier anonyme trouvé" });
    }

    // Fusionner les paniers si un panier anonyme existe
    if (anonymousCart) {
      // Créer un panier pour l'utilisateur si inexistant
      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
          totalAmount: 0,
          numberOfItems: 0,
        });
      }

      // Fusionner les items
      anonymousCart.items.forEach((item) => {
        const existingItemIndex = cart.items.findIndex((cartItem) =>
          cartItem.productId.equals(item.productId)
        );

        if (existingItemIndex > -1) {
          // Si l'article existe déjà, mettre à jour la quantité
          cart.items[existingItemIndex].qty += item.qty;
        } else {
          // Ajouter un nouvel article
          cart.items.push(item);
        }
      });

      // Recalculer totalAmount et numberOfItems après la fusion
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.qty,
        0
      );
      cart.numberOfItems = cart.items.reduce(
        (count, item) => count + item.qty,
        0
      );

      // Supprimer le panier anonyme
      await Cart.deleteOne({ anonymousId });
      await cart.save();

      // Générer un nouveau token sans l'`anonymousId`
      const token = jwt.sign(
        { userId }, // On ne garde plus l'`anonymousId` dans le token
        process.env.JWT_SECRET, // Assurez-vous de définir votre clé secrète dans l'environnement
        { expiresIn: "30d" } // Durée de validité du token
      );

      res.status(200).json({
        status: "success",
        cart,
        message: "Panier fusionné avec succès",
        token, // Nouveau token envoyé dans la réponse
      });
    }
  } catch (error) {
    console.error("Erreur dans mergeCart : ", error);
    res.status(500).json({ message: error.message });
  }
};
