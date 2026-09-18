# Self-Help Group Savings & Micro-Loan Tracker

A beginner-friendly, transparent, and responsive Server-Side Rendered (SSR) web application for managing rural Self-Help Groups (SHGs), monthly savings, micro-loans, simple interest calculations, repayment schedules, and defaulters tracking.

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **View Engine**: EJS (Embedded JavaScript for SSR)
- **Database**: MongoDB Atlas / Local MongoDB with Mongoose ODM
- **Authentication**: Session-based auth (`express-session`), Password hashing (`bcryptjs`)
- **Styling**: Vanilla CSS (Custom modern rural finance/fintech theme)

---

## 🌟 Key Features

### Admin (Group Leader):
- **Dashboard Overview**: Real-time KPI cards for:
  - Total Group Savings (Sum of all member savings)
  - Total Loans Disbursed (Sum of principal for approved loans)
  - Amount Recovered (Sum of paid repayments)
  - Active Loans & Total Members
  - Automated Defaulters Tracker (Highlights members with overdue installments)
- **SHG Management**: Create groups and view registered members.
- **Member Registration**: Add new members with secure hashed passwords.
- **Savings Management**: Record monthly member savings contributions into the ledger.
- **Loan Approvals**: Review pending micro-loan requests, compute 5% annual simple interest, and automatically generate installment schedules.
- **Repayment Tracking**: Mark monthly installments as paid with automatic timestamping.

### Member:
- **Member Dashboard**: Personal lifetime savings, active loan status, and outstanding balance.
- **Savings Passbook**: Digital passbook tracking monthly ₹500 deposits.
- **My Loans**: View loan status, repayment progress, and outstanding balances.
- **Loan Application**: Apply for micro-loans with a live interactive EMI & Simple Interest preview calculator.
- **Repayment Schedule**: Track installment due dates, paid statuses, and overdue alerts.

---

## 🛠️ Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/utkarshpatwa393-sys/SelfHelpProject-Ass-2-Web.git
cd SelfHelpProject-Ass-2-Web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/selfhelp_db
SESSION_SECRET=selfhelp_secret_key_college_hackathon_2026
```
*(Or use your MongoDB Atlas connection string for `MONGODB_URI`)*

### 4. Seed Demo Data
Populate the database with 1 Admin, 1 SHG Group, 5 Members, 16 Monthly Savings records, 1 Approved Loan with 10 installments, and 1 Pending Loan:
```bash
npm run seed
```

### 5. Start the Server
```bash
npm start
# OR for live autoreload:
npm run dev
```

Visit: `http://localhost:3000`

---

## 🔑 Demo Credentials (with 1-Click Autofill)

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@gmail.com` | `admin123` | Group Leader access with KPI stats & Defaulters |
| **Member 1** | `rahul@gmail.com` | `member123` | Active loan (₹10,000 dairy loan) & overdue demo |
| **Member 2** | `sunita@gmail.com` | `member123` | Pending loan request (₹15,000 shop loan) |

---

## 📐 Core Calculations

### Simple Interest Formula:
$$\text{Simple Interest} = \frac{\text{Principal} \times \text{Annual Rate (5\%)} \times (\text{Tenure in Months} / 12)}{100}$$

### Total Payable & Monthly EMI:
$$\text{Total Payable} = \text{Principal} + \text{Simple Interest}$$
$$\text{Monthly Installment (EMI)} = \frac{\text{Total Payable}}{\text{Tenure in Months}}$$

### Dynamic Outstanding Balance:
$$\text{Outstanding Balance} = \text{Total Loan Amount} - \sum(\text{Paid Repayment Amounts})$$

---

## 📄 License
ISC License. Built for College Hackathon & Academic Evaluation.
