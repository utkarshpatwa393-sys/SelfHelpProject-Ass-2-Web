const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { requireAdmin } = require("../middleware/auth");

const User = require("../models/User");
const Group = require("../models/Group");
const Savings = require("../models/Savings");
const Loan = require("../models/Loan");
const Repayment = require("../models/Repayment");

// Apply requireAdmin middleware to all /admin routes
router.use(requireAdmin);

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
router.get("/dashboard", async (req, res) => {
  try {
    // 1. Total Group Savings = SUM of all Savings.amount
    const allSavings = await Savings.find();
    let totalSavings = 0;
    for (let s of allSavings) {
      totalSavings += s.amount;
    }

    // 2. Loans Disbursed = SUM of all Approved or Completed Loan.amount
    const disbursedLoans = await Loan.find({
      status: { $in: ["Approved", "Completed"] },
    });
    let totalLoansDisbursed = 0;
    for (let l of disbursedLoans) {
      totalLoansDisbursed += l.amount;
    }

    // 3. Amount Recovered = SUM of all Paid Repayment.amount
    const paidRepayments = await Repayment.find({ status: "Paid" });
    let amountRecovered = 0;
    for (let r of paidRepayments) {
      amountRecovered += r.amount;
    }

    // 4. Active Loans Count (status === 'Approved')
    const activeLoansCount = await Loan.countDocuments({ status: "Approved" });

    // 5. Total Members Count
    const totalMembersCount = await User.countDocuments({ role: "Member" });

    // 6. Defaulters Identification
    // Defaulter = Member with Approved loan & at least 1 overdue Pending installment (dueDate < today)
    const today = new Date();
    const overdueRepayments = await Repayment.find({
      status: "Pending",
      dueDate: { $lt: today },
    }).populate("memberId").populate("loanId");

    // Group overdue repayments by member/loan to create a clear defaulters summary
    const defaultersMap = {};
    for (let r of overdueRepayments) {
      if (!r.memberId || !r.loanId) continue;
      // Only consider if loan is active (Approved)
      if (r.loanId.status === "Approved") {
        const memId = r.memberId._id.toString();
        if (!defaultersMap[memId]) {
          defaultersMap[memId] = {
            member: r.memberId,
            loan: r.loanId,
            pendingInstallments: 0,
            overdueAmount: 0,
          };
        }
        defaultersMap[memId].pendingInstallments += 1;
        defaultersMap[memId].overdueAmount += r.amount;
      }
    }
    const defaultersList = Object.values(defaultersMap);

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("admin/dashboard", {
      user: req.session.user,
      totalSavings,
      totalLoansDisbursed,
      amountRecovered,
      activeLoansCount,
      totalMembersCount,
      defaultersCount: defaultersList.length,
      defaultersList,
      error,
      success,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).render("login", {
      error: "Error loading Admin Dashboard: " + err.message,
      success: null,
    });
  }
});

// ==========================================
// 2. GROUPS MANAGEMENT
// ==========================================
router.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    const error = req.query.error || null;
    const success = req.query.success || null;
    res.render("admin/groups", {
      user: req.session.user,
      groups,
      error,
      success,
    });
  } catch (err) {
    console.error("Fetch groups error:", err);
    res.redirect("/admin/dashboard?error=Failed to fetch groups.");
  }
});

router.post("/groups", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.redirect("/admin/groups?error=Group name is required.");
    }
    await Group.create({
      name: name.trim(),
      description: description ? description.trim() : "",
    });
    res.redirect("/admin/groups?success=Group created successfully.");
  } catch (err) {
    console.error("Create group error:", err);
    res.redirect("/admin/groups?error=Failed to create group.");
  }
});

// ==========================================
// 3. MEMBERS MANAGEMENT
// ==========================================
router.get("/members", async (req, res) => {
  try {
    const members = await User.find({ role: "Member" })
      .populate("groupId")
      .sort({ createdAt: -1 });

    const error = req.query.error || null;
    const success = req.query.success || null;
    res.render("admin/members", {
      user: req.session.user,
      members,
      error,
      success,
    });
  } catch (err) {
    console.error("Fetch members error:", err);
    res.redirect("/admin/dashboard?error=Failed to fetch members.");
  }
});

router.get("/members/add", async (req, res) => {
  try {
    const groups = await Group.find();
    const error = req.query.error || null;
    const success = req.query.success || null;
    res.render("admin/add-member", {
      user: req.session.user,
      groups,
      error,
      success,
    });
  } catch (err) {
    console.error("Add member page error:", err);
    res.redirect("/admin/members?error=Failed to load add member form.");
  }
});

router.post("/members/add", async (req, res) => {
  try {
    const { name, email, password, groupId } = req.body;

    if (!name || !email || !password) {
      return res.redirect("/admin/members/add?error=All fields are required.");
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.redirect("/admin/members/add?error=Email already registered.");
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "Member",
      groupId: groupId && groupId !== "" ? groupId : null,
    });

    res.redirect("/admin/members?success=Member added successfully.");
  } catch (err) {
    console.error("Create member error:", err);
    res.redirect("/admin/members/add?error=Failed to add member: " + err.message);
  }
});

// ==========================================
// 4. SAVINGS MANAGEMENT
// ==========================================
router.get("/savings", async (req, res) => {
  try {
    const members = await User.find({ role: "Member" }).sort({ name: 1 });
    const savingsList = await Savings.find()
      .populate("memberId")
      .populate("groupId")
      .sort({ createdAt: -1 });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("admin/savings", {
      user: req.session.user,
      members,
      savingsList,
      error,
      success,
    });
  } catch (err) {
    console.error("Fetch savings error:", err);
    res.redirect("/admin/dashboard?error=Failed to fetch savings.");
  }
});

router.post("/savings/add", async (req, res) => {
  try {
    const { memberId, month, year, amount } = req.body;

    if (!memberId || !month || !year || !amount || Number(amount) <= 0) {
      return res.redirect("/admin/savings?error=All savings fields are required and amount must be positive.");
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.redirect("/admin/savings?error=Selected member not found.");
    }

    await Savings.create({
      memberId: member._id,
      groupId: member.groupId || null,
      month: month.trim(),
      year: Number(year),
      amount: Number(amount),
    });

    res.redirect("/admin/savings?success=Savings record added successfully.");
  } catch (err) {
    console.error("Add savings error:", err);
    res.redirect("/admin/savings?error=Failed to record savings.");
  }
});

// ==========================================
// 5. LOANS MANAGEMENT & APPROVAL / REJECTION
// ==========================================
router.get("/loans", async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate("memberId")
      .populate("groupId")
      .sort({ createdAt: -1 });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("admin/loans", {
      user: req.session.user,
      loans,
      error,
      success,
    });
  } catch (err) {
    console.error("Fetch loans error:", err);
    res.redirect("/admin/dashboard?error=Failed to fetch loans.");
  }
});

// POST /admin/loans/:id/approve - Approve loan, calculate interest, create repayments
router.post("/loans/:id/approve", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.redirect("/admin/loans?error=Loan not found.");
    }
    if (loan.status !== "Pending") {
      return res.redirect("/admin/loans?error=Loan is not pending approval.");
    }

    // 1. Calculate Simple Interest
    // Formula: Simple Interest = (Principal * Rate * Time in Years) / 100
    // Time in Years = tenure / 12
    const principal = loan.amount;
    const rate = loan.interestRate || 5; // 5% annual
    const timeInYears = loan.tenure / 12;
    const simpleInterest = (principal * rate * timeInYears) / 100;
    const totalPayable = Math.round(principal + simpleInterest);
    const monthlyInstallment = Math.round(totalPayable / loan.tenure);

    // 2. Update Loan record
    loan.status = "Approved";
    loan.totalAmount = totalPayable;
    loan.approvedAt = new Date();
    await loan.save();

    // 3. Generate Installment Schedule (Repayments)
    // Create 'tenure' repayment documents spaced 1 month apart
    const now = new Date();
    for (let i = 1; i <= loan.tenure; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(now.getMonth() + i);

      await Repayment.create({
        loanId: loan._id,
        memberId: loan.memberId,
        installmentNumber: i,
        amount: monthlyInstallment,
        dueDate: dueDate,
        status: "Pending",
      });
    }

    res.redirect("/admin/loans?success=Loan approved! Installment schedule generated.");
  } catch (err) {
    console.error("Approve loan error:", err);
    res.redirect("/admin/loans?error=Failed to approve loan: " + err.message);
  }
});

// POST /admin/loans/:id/reject - Reject loan
router.post("/loans/:id/reject", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.redirect("/admin/loans?error=Loan not found.");
    }
    if (loan.status !== "Pending") {
      return res.redirect("/admin/loans?error=Only pending loans can be rejected.");
    }

    loan.status = "Rejected";
    await loan.save();

    res.redirect("/admin/loans?success=Loan rejected.");
  } catch (err) {
    console.error("Reject loan error:", err);
    res.redirect("/admin/loans?error=Failed to reject loan.");
  }
});

// ==========================================
// 6. REPAYMENTS MANAGEMENT
// ==========================================
router.get("/repayments", async (req, res) => {
  try {
    const repayments = await Repayment.find()
      .populate("memberId")
      .populate("loanId")
      .sort({ dueDate: 1 });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("admin/repayments", {
      user: req.session.user,
      repayments,
      error,
      success,
    });
  } catch (err) {
    console.error("Fetch repayments error:", err);
    res.redirect("/admin/dashboard?error=Failed to fetch repayments.");
  }
});

// POST /admin/repayments/:id/pay - Mark repayment as Paid
router.post("/admin/repayments/:id/pay", async (req, res) => {
  try {
    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.redirect("/admin/repayments?error=Repayment not found.");
    }

    repayment.status = "Paid";
    repayment.paidDate = new Date();
    await repayment.save();

    // Check if all repayments for this loan are now paid
    const pendingCount = await Repayment.countDocuments({
      loanId: repayment.loanId,
      status: "Pending",
    });

    if (pendingCount === 0) {
      await Loan.findByIdAndUpdate(repayment.loanId, { status: "Completed" });
    }

    res.redirect("/admin/repayments?success=Repayment marked as Paid.");
  } catch (err) {
    console.error("Record repayment error:", err);
    res.redirect("/admin/repayments?error=Failed to record repayment.");
  }
});

// Alias for repayment pay route matching the route prefix in router
router.post("/repayments/:id/pay", async (req, res) => {
  try {
    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.redirect("/admin/repayments?error=Repayment not found.");
    }

    repayment.status = "Paid";
    repayment.paidDate = new Date();
    await repayment.save();

    // Check if all repayments for this loan are now paid
    const pendingCount = await Repayment.countDocuments({
      loanId: repayment.loanId,
      status: "Pending",
    });

    if (pendingCount === 0) {
      await Loan.findByIdAndUpdate(repayment.loanId, { status: "Completed" });
    }

    res.redirect("/admin/repayments?success=Repayment marked as Paid.");
  } catch (err) {
    console.error("Record repayment error:", err);
    res.redirect("/admin/repayments?error=Failed to record repayment.");
  }
});

module.exports = router;
