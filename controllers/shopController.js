const Product = require("../models/productModel");

// recuperer tous les produits
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ msg: "Erreur lors de la récupération des produits" });
  }
};
