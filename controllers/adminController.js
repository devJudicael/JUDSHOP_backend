const Product = require("../models/productModel");
const { cloudinary } = require("../configs/cloudinary");

// Ajouter un produit
exports.addProduct = async (req, res) => {
  const { name, price, categorie } = req.body;

  try {
    // Vérifie si un fichier d'image a été téléchargé
    if (!req.file) {
      return res.status(400).json({ msg: "Aucune image téléchargée" });
    }

    // Upload de l'image sur Cloudinary et récupération de l'URL sécurisée
    const result = await cloudinary.uploader.upload(req.file.path);
    const imageUrl = result.secure_url;

    console.log(imageUrl);

    // Création d'un nouveau produit avec l'URL de l'image
    const newProduct = new Product({
      name,
      price,
      categorie,
      image: imageUrl,
    });

    // Sauvegarde du produit dans la base de données
    await newProduct.save();

    // Réponse avec le produit créé
    res.status(201).json({ msg: "produit ajouté avec succes", newProduct });
  } catch (error) {
    // Gestion des erreurs d'upload ou de sauvegarde
    console.error("Erreur lors de l'ajout du produit:", error);
    res.status(500).json({ msg: "Erreur lors de l'ajout du produit" });
  }
};
