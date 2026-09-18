require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const memberRoutes = require("./routes/memberRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/selfhelp_db";
const SESSION_SECRET = process.env.SESSION_SECRET || "selfhelp_secret_key_hackathon_2026";

// 1. Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("----------------------------------------");
    console.log("✓ MongoDB Connected Successfully!");
    console.log("Database URI:", MONGODB_URI);
    console.log("----------------------------------------");
  })
  .catch((err) => {
    console.error("✗ MongoDB Connection Error:", err.message);
  });

// 2. Configure View Engine (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 3. Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 4. Session Configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// 5. Global user variable for all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 6. Mount Application Routes
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/member", memberRoutes);

// 7. 404 Handler
app.use((req, res) => {
  res.status(404).render("login", {
    error: "404 - Page not found.",
    success: null,
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).render("login", {
    error: "A server error occurred. Please try again.",
    success: null,
  });
});

// 9. Start Server
app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log(`  Admin Dashboard  : http://localhost:${PORT}/admin/dashboard`);
  console.log(`  Member Dashboard : http://localhost:${PORT}/member/dashboard`);
});
