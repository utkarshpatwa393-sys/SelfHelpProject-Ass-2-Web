const mongoose = require("mongoose");

// Loan Schema represents micro-loan requests, approvals, and terms
const loanSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  tenure: {
    type: Number,
    required: true,
    min: 1, // in months
  },
  interestRate: {
    type: Number,
    default: 5, // 5% annual interest rate
  },
  totalAmount: {
    type: Number,
    default: 0, // Principal + Interest calculated upon approval
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Completed"],
    default: "Pending",
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Loan", loanSchema);
