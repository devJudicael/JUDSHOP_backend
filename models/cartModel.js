const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  image: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },
});

const cartSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  anonymousId: { type: String }, // Identifiant pour panier non connecté
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
  numberOfItems: { type: Number, default: 0 },
});

module.exports = mongoose.model("Cart", cartSchema);
