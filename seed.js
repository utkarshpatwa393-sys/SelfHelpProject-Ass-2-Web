require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Group = require("./models/Group");
const Savings = require("./models/Savings");
const Loan = require("./models/Loan");
const Repayment = require("./models/Repayment");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/selfhelp_db";

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB:", MONGODB_URI);

    // 1. Clear existing collections to start fresh
    await User.deleteMany({});
    await Group.deleteMany({});
    await Savings.deleteMany({});
    await Loan.deleteMany({});
    await Repayment.deleteMany({});
    console.log("Cleared old database records.");

    // 2. Hash default passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const memberPassword = await bcrypt.hash("member123", 10);

    // 3. Create Sample Group
    const group = await Group.create({
      name: "Shakti Self Help Group",
      description: "Local women's community savings and micro-finance group",
    });
    console.log("Created Group:", group.name);

    // 4. Create Admin User
    const admin = await User.create({
      name: "Group Admin",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "Admin",
      groupId: group._id,
    });
    console.log("Created Admin:", admin.email);

    // 5. Create 5 Sample Members
    const membersData = [
      { name: "Rahul Sharma", email: "rahul@gmail.com" },
      { name: "Sunita Devi", email: "sunita@gmail.com" },
      { name: "Anita Roy", email: "anita@gmail.com" },
      { name: "Ramesh Kumar", email: "ramesh@gmail.com" },
      { name: "Priya Patel", email: "priya@gmail.com" },
    ];

    const members = [];
    for (let m of membersData) {
      const createdMember = await User.create({
        name: m.name,
        email: m.email,
        password: memberPassword,
        role: "Member",
        groupId: group._id,
      });
      members.push(createdMember);
    }
    console.log(`Created ${members.length} sample members.`);

    // 6. Create Monthly Savings Records
    const savingsRecords = [
      // Rahul (6 contributions = ₹3,000)
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "April", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "May", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "June", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "July", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[0]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },

      // Sunita (4 contributions = ₹2,000)
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "June", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "July", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[1]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },

      // Anita (3 contributions = ₹1,500)
      { memberId: members[2]._id, groupId: group._id, amount: 500, month: "July", year: 2026 },
      { memberId: members[2]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[2]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },

      // Ramesh (2 contributions = ₹1,000)
      { memberId: members[3]._id, groupId: group._id, amount: 500, month: "August", year: 2026 },
      { memberId: members[3]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },

      // Priya (1 contribution = ₹500)
      { memberId: members[4]._id, groupId: group._id, amount: 500, month: "September", year: 2026 },
    ];

    await Savings.insertMany(savingsRecords);
    console.log(`Created ${savingsRecords.length} monthly savings records (Total: ₹8,000).`);

    // 7. Create Sample Loans
    // Loan 1: Approved Loan for Rahul Sharma (₹10,000 for 10 months)
    const principal1 = 10000;
    const tenure1 = 10;
    const rate1 = 5;
    const interest1 = (principal1 * rate1 * (tenure1 / 12)) / 100;
    const totalAmount1 = Math.round(principal1 + interest1); // ~10417
    const emi1 = Math.round(totalAmount1 / tenure1); // ~1042

    const approvedDate = new Date();
    approvedDate.setMonth(approvedDate.getMonth() - 3); // Approved 3 months ago

    const loan1 = await Loan.create({
      memberId: members[0]._id,
      groupId: group._id,
      amount: principal1,
      purpose: "Small Dairy Cattle Purchase",
      tenure: tenure1,
      interestRate: rate1,
      totalAmount: totalAmount1,
      status: "Approved",
      approvedAt: approvedDate,
    });

    // Generate Repayments for Loan 1
    // Installment 1: Paid 2 months ago
    const due1 = new Date();
    due1.setMonth(due1.getMonth() - 2);
    await Repayment.create({
      loanId: loan1._id,
      memberId: members[0]._id,
      installmentNumber: 1,
      amount: emi1,
      dueDate: due1,
      paidDate: due1,
      status: "Paid",
    });

    // Installment 2: Paid 1 month ago
    const due2 = new Date();
    due2.setMonth(due2.getMonth() - 1);
    await Repayment.create({
      loanId: loan1._id,
      memberId: members[0]._id,
      installmentNumber: 2,
      amount: emi1,
      dueDate: due2,
      paidDate: due2,
      status: "Paid",
    });

    // Installment 3: Overdue by 10 days -> Pending (Demonstrates Defaulter identification!)
    const due3 = new Date();
    due3.setDate(due3.getDate() - 10);
    await Repayment.create({
      loanId: loan1._id,
      memberId: members[0]._id,
      installmentNumber: 3,
      amount: emi1,
      dueDate: due3,
      status: "Pending",
    });

    // Installments 4 through 10: Future upcoming installments
    for (let i = 4; i <= tenure1; i++) {
      const futureDue = new Date();
      futureDue.setMonth(futureDue.getMonth() + (i - 3));
      await Repayment.create({
        loanId: loan1._id,
        memberId: members[0]._id,
        installmentNumber: i,
        amount: emi1,
        dueDate: futureDue,
        status: "Pending",
      });
    }
    console.log("Created Approved Loan 1 with 10 installments for Rahul Sharma.");

    // Loan 2: Pending Loan Request for Sunita Devi (₹15,000 for 12 months)
    await Loan.create({
      memberId: members[1]._id,
      groupId: group._id,
      amount: 15000,
      purpose: "Grocery Shop Inventory Expansion",
      tenure: 12,
      interestRate: 5,
      status: "Pending",
    });
    console.log("Created Pending Loan 2 for Sunita Devi (Ready for demo approval).");

    console.log("\n==================================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log("Demo Credentials:");
    console.log("Admin  : admin@gmail.com / admin123");
    console.log("Member : rahul@gmail.com / member123");
    console.log("Member : sunita@gmail.com / member123");
    console.log("==================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
