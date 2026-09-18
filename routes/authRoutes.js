const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Group = require("../models/Group");

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
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const password = req.body.password ? req.body.password.trim() : "";

    if (!email || !password) {
      return res.render("login", {
        error: "Please provide both email and password.",
        success: null,
      });
    }

    // Find user by lowercase email
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", {
        error: "User not found with this email. Please register or check credentials.",
        success: null,
      });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", {
        error: "Incorrect password. Please try again.",
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
      error: "An error occurred during login: " + err.message,
      success: null,
    });
  }
});

// GET /register - Show member self-registration page
router.get("/register", async (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(req.session.user.role === "Admin" ? "/admin/dashboard" : "/member/dashboard");
  }
  try {
    let groups = await Group.find().sort({ name: 1 });
    // If no group exists yet, create default group
    if (groups.length === 0) {
      const defaultGroup = await Group.create({
        name: "Shakti Self Help Group",
        description: "Primary community self-help savings and micro-finance group",
      });
      groups = [defaultGroup];
    }
    const error = req.query.error || null;
    const success = req.query.success || null;
    res.render("register", { groups, error, success });
  } catch (err) {
    console.error("Fetch groups for register error:", err);
    res.render("login", { error: "Failed to load registration. Please try again.", success: null });
  }
});

// POST /register - Process member self-registration
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name ? req.body.name.trim() : "";
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const password = req.body.password ? req.body.password.trim() : "";
    let groupId = req.body.groupId ? req.body.groupId.trim() : "";

    if (!name || !email || !password) {
      const groups = await Group.find();
      return res.render("register", {
        groups,
        error: "All fields are required.",
        success: null,
      });
    }

    if (password.length < 4) {
      const groups = await Group.find();
      return res.render("register", {
        groups,
        error: "Password must be at least 4 characters long.",
        success: null,
      });
    }

    // Check if email already registered
    const existing = await User.findOne({ email });
    if (existing) {
      const groups = await Group.find();
      return res.render("register", {
        groups,
        error: "Email is already registered. Please log in.",
        success: null,
      });
    }

    // If no groupId provided, attach to first available group
    if (!groupId) {
      let firstGroup = await Group.findOne();
      if (!firstGroup) {
        firstGroup = await Group.create({
          name: "Shakti Self Help Group",
          description: "Primary community self-help savings and micro-finance group",
        });
      }
      groupId = firstGroup._id;
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "Member",
      groupId,
    });

    // Automatically log user in
    req.session.user = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      groupId: newUser.groupId ? newUser.groupId.toString() : null,
    };

    res.redirect("/member/dashboard?success=" + encodeURIComponent("Welcome! Your member account has been created successfully."));
  } catch (err) {
    console.error("Registration error:", err);
    const groups = await Group.find().catch(() => []);
    res.render("register", {
      groups,
      error: "Registration failed: " + err.message,
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
