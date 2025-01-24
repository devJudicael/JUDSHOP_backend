const express = require("express");
const router = express.Router();

// Importation du middleware Cloudinary/Multer pour l'upload des images
const { upload } = require("../configs/cloudinary");

// Importation du controller
const adminController = require("../controllers/adminController");

// Ajouter un produit avec image
router.post("/addProduct", upload.single("image"), adminController.addProduct);

module.exports = router;
