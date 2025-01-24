const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./configs/db");
const cookieParser = require("cookie-parser");
// importer les routes
const adminRoute = require("./routes/adminRoute");
const shopRoute = require("./routes/shopRoute");
const authRoute = require("./routes/authRoute");
const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");

// charger les variables d'environnements

// connexion à la base de données
connectDB();

const app = express();

// Middlewares

app.use(
  cors({
    origin: "https://judshop-frontend.vercel.app", // L'origine autorisée (frontend)
    credentials: true, // Permet les cookies ou les credentials
  })
);

app.get("/", (req, res) => {
  res.json("hello");
});

// parser le JSON
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 3000;

// utiliser les routes
app.use("/api/admin", adminRoute);
app.use("/api", shopRoute);
app.use("/api", authRoute);
app.use("/api", cartRoute);
app.use("/api", orderRoute);
app.listen(port, () => console.log(`Server running on port ${port}`));
