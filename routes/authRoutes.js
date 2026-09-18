const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Root route - redirect based on session
router.get("/", (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === "Admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/member/dashboard");
    }
  }
  res.redirect("/login");
});

// GET /login - Show login page
router.get("/login", (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === "Admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/member/dashboard");
    }
  }
  const error = req.query.error || null;
  const success = req.query.success || null;
  res.render("login", { error, success });
});

// POST /login - Process user credentials
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", {
        error: "Please provide both email and password.",
        success: null,
      });
    }

    // Find user by lowercase email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        success: null,
      });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", {
        error: "Invalid email or password.",
        success: null,
      });
    }

    // Save user info in session
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.groupId ? user.groupId.toString() : null,
    };

    // Redirect based on role
    if (user.role === "Admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/member/dashboard");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", {
      error: "An error occurred during login. Please try again.",
      success: null,
    });
  }
});

// GET /logout - Destroy session and redirect
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login?success=" + encodeURIComponent("You have been logged out."));
  });
});

module.exports = router;
