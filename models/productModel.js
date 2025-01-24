const mongoose = require("mongoose");
const schema = mongoose.Schema;

const productSchema = new schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },

  image: {
    type: String,
    required: true,
  },
  categorie: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);
