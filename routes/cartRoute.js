const express = require("express");
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/cartMiddleware");

const router = express.Router();

router.get("/getCart", authMiddleware, cartController.getCart);
router.post("/addToCart", authMiddleware, cartController.addToCart);
router.post("/removeFromCart", authMiddleware, cartController.removeFromCart);
router.post("/deleteFromCart", authMiddleware, cartController.deleteFromCart);
router.post("/resetCart", authMiddleware, cartController.resetCart);
router.post(
  "/mergeCartOnLogin",
  authMiddleware,
  cartController.mergeCartOnLogin
);

module.exports = router;
