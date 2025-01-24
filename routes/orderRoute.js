const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/cartMiddleware.js");

const orderController = require("../controllers/orderController.js");

router.get("/getOrder/:idOrder", AuthMiddleware, orderController.getOrder);
router.get("/getOrders", AuthMiddleware, orderController.fetchOrders);
router.post("/postOrder", AuthMiddleware, orderController.postOrder);

module.exports = router;
