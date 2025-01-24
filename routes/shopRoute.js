const express = require("express");
const router = express.Router();

// importation controller
const shopController = require("../controllers/shopController");

// routes

// recuperer les produits
router.get("/", shopController.getProducts);

module.exports = router;
