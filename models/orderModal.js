const mongoose = require("mongoose");

const commandSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["waiting", "cancel", "valid"],
    default: "waiting",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uuid: {
    type: Number,
    required: true,
    unique: true,
  },
  articles: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: { type: String, required: true },
      image: { type: String },
      qty: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    },
  ],
  infoUser: {
    tel: {
      type: String,
      required: true,
      match: /^\+?[0-9]{1,4}?[-. ]?[0-9]{1,12}?$/,
    },
    ville: { type: String, required: true, minlength: 2 },
    commune: { type: String, required: true, minlength: 3 },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  numberOfItems: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: String,
    required: true,
  },
  hour: {
    type: String,
    required: true,
  },
});

// Création du modèle Command basé sur le schéma
const Command = mongoose.model("Command", commandSchema);

module.exports = Command;
