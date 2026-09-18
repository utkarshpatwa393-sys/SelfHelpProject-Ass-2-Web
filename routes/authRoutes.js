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

// GET /seed-db - 1-Click Database Population Route (Useful for Render and Cloud Deployments)
router.get("/seed-db", async (req, res) => {
  try {
    const Savings = require("../models/Savings");
    const Loan = require("../models/Loan");
    const Repayment = require("../models/Repayment");

    // 1. Clear existing collections
    await User.deleteMany({});
    await Group.deleteMany({});
    await Savings.deleteMany({});
    await Loan.deleteMany({});
    await Repayment.deleteMany({});

    // 2. Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const memberPassword = await bcrypt.hash("member123", 10);

    // 3. Create Group
    const group = await Group.create({
      name: "Shakti Self Help Group",
      description: "Local women's community savings and micro-finance group",
    });

    // 4. Create Admin
    await User.create({
      name: "Group Admin",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "Admin",
      groupId: group._id,
    });

    // 5. Create 5 Members
    const membersData = [
      { name: "Rahul Sharma", email: "rahul@gmail.com" },
      { name: "Sunita Devi", email: "sunita@gmail.com" },
      { name: "Anita Roy", email: "anita@gmail.com" },
      { name: "Ramesh Kumar", email: "ramesh@gmail.com" },
      { name: "Priya Patel", email: "priya@gmail.com" },
    ];

    const members = [];
    for (let m of membersData) {
      const created = await User.create({
        name: m.name,
        email: m.email,
        password: memberPassword,
        role: "Member",
        groupId: group._id,
      });
      members.push(created);
    }

    // 6. Create Savings
    const savingsRecords = [
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "April", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "May", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "June", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "July", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "June", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "July", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },
      { memberId: members[2]._id, groupId: group._id, amount: 500, month: "July", year: 2026 },
      { memberId: members[2]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[2]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },
      { memberId: members[3]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[3]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },
      { memberId: members[4]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },
    ];
    await Savings.insertMany(savingsRecords);

    // 7. Create Loans & Installments
    const loan1 = await Loan.create({
      memberId: members[0]._id,
      groupId: group._id,
      amount: 10000,
      purpose: "Small Dairy Cattle Purchase",
      tenure: 10,
      interestRate: 5,
      totalAmount: 10417,
      status: "Approved",
      approvedAt: new Date(),
    });

    const due1 = new Date(); due1.setMonth(due1.getMonth() - 2);
    await Repayment.create({ loanId: loan1._id, memberId: members[0]._id, installmentNumber: 1, amount: 1042, dueDate: due1, paidDate: due1, status: "Paid" });
    const due2 = new Date(); due2.setMonth(due2.getMonth() - 1);
    await Repayment.create({ loanId: loan1._id, memberId: members[0]._id, installmentNumber: 2, amount: 1042, dueDate: due2, paidDate: due2, status: "Paid" });
    const due3 = new Date(); due3.setDate(due3.getDate() - 10);
    await Repayment.create({ loanId: loan1._id, memberId: members[0]._id, installmentNumber: 3, amount: 1042, dueDate: due3, status: "Pending" });

    for (let i = 4; i <= 10; i++) {
      const futureDue = new Date(); futureDue.setMonth(futureDue.getMonth() + (i - 3));
      await Repayment.create({ loanId: loan1._id, memberId: members[0]._id, installmentNumber: i, amount: 1042, dueDate: futureDue, status: "Pending" });
    }

    await Loan.create({
      memberId: members[1]._id,
      groupId: group._id,
      amount: 15000,
      purpose: "Grocery Shop Inventory Expansion",
      tenure: 12,
      interestRate: 5,
      status: "Pending",
    });

    res.redirect("/login?success=" + encodeURIComponent("Database seeded successfully! Admin: admin@gmail.com / admin123 | Member: rahul@gmail.com / member123"));
  } catch (err) {
    console.error("Seed route error:", err);
    res.redirect("/login?error=" + encodeURIComponent("Failed to seed database: " + err.message));
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
