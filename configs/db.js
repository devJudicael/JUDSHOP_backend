const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connexion à la base de données réussie");
  } catch (error) {
    return console.error(
      `Erreur de connexion à la base de données : ${error.message}`
    );
  }
};

module.exports = connectDB;
