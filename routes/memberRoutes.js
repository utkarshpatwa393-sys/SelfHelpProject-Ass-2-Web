const express = require("express");
const router = express.Router();
const { requireMember } = require("../middleware/auth");

const User = require("../models/User");
const Savings = require("../models/Savings");
const Loan = require("../models/Loan");
const Repayment = require("../models/Repayment");

// Apply requireMember middleware to all /member routes
router.use(requireMember);

// ==========================================
// 1. MEMBER DASHBOARD
// ==========================================
router.get("/dashboard", async (req, res) => {
  try {
    const memberId = req.session.user.id;

    // 1. My Total Savings
    const mySavings = await Savings.find({ memberId });
    let totalSavings = 0;
    for (let s of mySavings) {
      totalSavings += s.amount;
    }

    // 2. My Active Loan (most recent Approved loan)
    const activeLoan = await Loan.findOne({
      memberId,
      status: "Approved",
    }).sort({ approvedAt: -1 });

    let outstandingBalance = 0;
    let amountPaid = 0;
    let pendingInstallments = 0;
    let paidInstallments = 0;

    if (activeLoan) {
      // Calculate repayments
      const repayments = await Repayment.find({ loanId: activeLoan._id });
      for (let r of repayments) {
        if (r.status === "Paid") {
          amountPaid += r.amount;
          paidInstallments += 1;
        } else {
          pendingInstallments += 1;
        }
      }
      // Outstanding Balance = Total Payable - Amount Paid
      outstandingBalance = Math.max(0, activeLoan.totalAmount - amountPaid);
    }

    // Also check for pending loan requests to notify member
    const pendingLoanRequest = await Loan.findOne({
      memberId,
      status: "Pending",
    });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("member/dashboard", {
      user: req.session.user,
      totalSavings,
      activeLoan,
      outstandingBalance,
      amountPaid,
      pendingInstallments,
      paidInstallments,
      pendingLoanRequest,
      error,
      success,
    });
  } catch (err) {
    console.error("Member dashboard error:", err);
    res.status(500).render("login", {
      error: "Error loading Member Dashboard: " + err.message,
      success: null,
    });
  }
});

// ==========================================
// 2. SAVINGS PASSBOOK
// ==========================================
router.get("/savings", async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const savingsList = await Savings.find({ memberId }).sort({ createdAt: -1 });

    let totalSavings = 0;
    for (let s of savingsList) {
      totalSavings += s.amount;
    }

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("member/savings", {
      user: req.session.user,
      savingsList,
      totalSavings,
      error,
      success,
    });
  } catch (err) {
    console.error("Member savings error:", err);
    res.redirect("/member/dashboard?error=Failed to load savings passbook.");
  }
});

// ==========================================
// 3. MEMBER LOAN STATUS & HISTORY
// ==========================================
router.get("/loans", async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const rawLoans = await Loan.find({ memberId }).sort({ createdAt: -1 });

    // Enhance each loan with amountPaid & outstandingBalance
    const loans = [];
    for (let l of rawLoans) {
      const repayments = await Repayment.find({ loanId: l._id });
      let paid = 0;
      let pending = 0;
      for (let r of repayments) {
        if (r.status === "Paid") {
          paid += r.amount;
        } else {
          pending += 1;
        }
      }

      let outstanding = 0;
      if (l.status === "Approved") {
        outstanding = Math.max(0, l.totalAmount - paid);
      } else if (l.status === "Completed") {
        outstanding = 0;
      }

      loans.push({
        ...l.toObject(),
        amountPaid: paid,
        outstandingBalance: outstanding,
        pendingInstallments: pending,
      });
    }

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("member/loans", {
      user: req.session.user,
      loans,
      error,
      success,
    });
  } catch (err) {
    console.error("Member loans error:", err);
    res.redirect("/member/dashboard?error=Failed to load loan status.");
  }
});

// ==========================================
// 4. REQUEST LOAN
// ==========================================
router.get("/loan/request", (req, res) => {
  const error = req.query.error || null;
  const success = req.query.success || null;
  res.render("member/request-loan", {
    user: req.session.user,
    error,
    success,
  });
});

router.post("/loan/request", async (req, res) => {
  try {
    const { amount, purpose, tenure } = req.body;
    const memberId = req.session.user.id;

    if (!amount || !purpose || !tenure || Number(amount) <= 0 || Number(tenure) <= 0) {
      return res.redirect("/member/loan/request?error=Please fill all fields with valid amounts and tenure.");
    }

    // Check if member already has an active or pending loan
    const existingActiveLoan = await Loan.findOne({
      memberId,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existingActiveLoan) {
      return res.redirect(
        "/member/loans?error=" +
          encodeURIComponent("You already have a Pending or Active loan. You can apply again once cleared.")
      );
    }

    const member = await User.findById(memberId);

    // Create loan request with status: "Pending"
    await Loan.create({
      memberId,
      groupId: member ? member.groupId : null,
      amount: Number(amount),
      purpose: purpose.trim(),
      tenure: Number(tenure),
      interestRate: 5, // 5% annual standard interest rate
      status: "Pending",
    });

    res.redirect("/member/loans?success=Loan request submitted successfully! Awaiting Admin approval.");
  } catch (err) {
    console.error("Loan request error:", err);
    res.redirect("/member/loan/request?error=Failed to submit loan request: " + err.message);
  }
});

// ==========================================
// 5. REPAYMENT SCHEDULE
// ==========================================
router.get("/repayments", async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const repayments = await Repayment.find({ memberId })
      .populate("loanId")
      .sort({ dueDate: 1 });

    let paidCount = 0;
    let pendingCount = 0;
    let totalPaid = 0;
    let totalPending = 0;

    for (let r of repayments) {
      if (r.status === "Paid") {
        paidCount += 1;
        totalPaid += r.amount;
      } else {
        pendingCount += 1;
        totalPending += r.amount;
      }
    }

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render("member/repayments", {
      user: req.session.user,
      repayments,
      paidCount,
      pendingCount,
      totalPaid,
      totalPending,
      error,
      success,
    });
  } catch (err) {
    console.error("Member repayments error:", err);
    res.redirect("/member/dashboard?error=Failed to load repayment schedule.");
  }
});

module.exports = router;
