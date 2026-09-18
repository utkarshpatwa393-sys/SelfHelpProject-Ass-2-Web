# SMART INDIA HACKATHON (SIH) PRESENTATION TEMPLATE
## PROJECT: Self-Help Group Savings & Micro-Loan Tracker

---

### SLIDE 1: Title & Team Overview
- **Problem Statement Title**: Transparent Digital Financial Record-Keeping & Micro-Lending Portal for Rural Self-Help Groups (SHGs)
- **Problem Statement Category**: Software
- **Theme / Domain**: Smart Automation / Rural Finance / FinTech / Social Inclusion
- **Team Name**: [Your Team Name]
- **Team Leader**: Utkarsh Patwa
- **Team Members**: [Member 1, Member 2, Member 3, Member 4, Member 5]
- **College / Institute**: [Your College Name]

---

### SLIDE 2: Proposed Solution
#### Objective:
To replace manual, error-prone paper accounting in rural Self-Help Groups with a lightweight, secure, and transparent Server-Side Rendered (SSR) web portal.

#### Core Capabilities:
- **Digital Savings Passbook**: Real-time tracking of monthly member contributions with instant ledger updates.
- **Automated Micro-Lending**: Transparent loan applications with integrated 5% simple interest calculation.
- **One-Click Installment Schedules**: Automatic generation of monthly repayment records upon loan approval.
- **Proactive Defaulter Detection**: Real-time flagging of overdue pending installments without complex credit bureaus.
- **Role-Based Portals**: Dedicated, isolated environments for Group Leaders (Admin) and SHG Members.

---

### SLIDE 3: Technical Architecture & System Flow

```
+-----------------------------------------------------------------------------------+
|                               USER CLIENT LAYER                                   |
|       [ SHG Group Leader (Admin) ]                 [ SHG Member (Rural User) ]    |
+------------------------------------+----------------------------------------------+
                                     |  HTTP / HTTPS Requests
                                     v
+-----------------------------------------------------------------------------------+
|                             SERVER-SIDE LOGIC (Node.js & Express)                 |
|                                                                                   |
|  +---------------------------+  +-----------------------------------------------+ |
|  | Authentication & Security |  | Business Logic Layer                          | |
|  | - bcrypt Password Hashing |  | - Simple Interest Engine: (P * R * T) / 100   | |
|  | - Session-Based RBAC      |  | - Installment Generator (Monthly Schedule)     | |
|  | - Route Guard Middleware  |  | - Defaulter Identification Engine              | |
|  +---------------------------+  +-----------------------------------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  | Server-Side Rendering (EJS Engine)                                           | |
|  | -> Generates lightweight, fully-rendered HTML for low-bandwidth networks     | |
|  +------------------------------------------------------------------------------+ |
+------------------------------------+----------------------------------------------+
                                     |  Mongoose ODM
                                     v
+-----------------------------------------------------------------------------------+
|                               DATABASE LAYER (MongoDB Atlas)                      |
|   [ Users ]      [ Groups ]      [ Savings ]      [ Loans ]      [ Repayments ]   |
+-----------------------------------------------------------------------------------+
```

---

### SLIDE 4: Key Features & Innovation

1. **Lightweight & High-Speed Performance**:
   - Built on Server-Side Rendering (EJS) requiring minimal client-side compute, ideal for basic smartphones in rural areas.
2. **Transparent Mathematical Models**:
   - Standardized simple interest formula eliminates disputes between members and group leaders.
3. **Automated Defaulters Flagging**:
   - Automatically compares `dueDate < CurrentDate` for pending installments, highlighting risks before they become bad debts.
4. **Dynamic Outstanding Balance**:
   - Automatically computes `Total Loan - Paid Installments` on the fly without database synchronization overhead.
5. **Interactive EMI Estimator**:
   - Real-time client-side calculation preview before a member submits a loan application.

---

### SLIDE 5: Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Runtime & Backend** | **Node.js + Express.js** | High concurrency, event-driven, lightweight RESTful architecture |
| **Rendering Engine** | **EJS (SSR)** | Fast server-side rendering; renders complete HTML for low-end mobile browsers |
| **Database** | **MongoDB Atlas + Mongoose** | Flexible JSON document model; schema validation and relational references |
| **Security & Auth** | **bcryptjs + express-session** | Salted password hashing and secure, role-restricted sessions |
| **Frontend Styling** | **Modern Vanilla CSS** | Zero external heavy UI dependencies; fast load times and clean responsiveness |

---

### SLIDE 6: Feasibility & Viability

- **Cost-Effective**: 100% open-source tech stack with no expensive cloud dependencies or proprietary licensing costs.
- **Low Hardware Requirement**: Server-side rendering ensures the app runs smoothly on ₹5,000 Android phones without heavy JavaScript processing.
- **Ease of Deployment**: Containerizable and deployable to cloud platforms (Render, AWS, DigitalOcean) with minimal operational overhead.
- **High Data Integrity**: Uses Mongoose references (`memberId`, `groupId`, `loanId`) to maintain full financial audit trails.

---

### SLIDE 7: Social Impact & Benefits

- **Empowering Women Micro-Entrepreneurs**: Enables rural women to build verified savings histories for future formal credit access.
- **Eliminating Fraud & Accounting Errors**: Eradicates tampering and calculation mistakes prevalent in manual physical registers.
- **Community Trust**: Every member can independently inspect their personal savings and repayment ledger anytime.
- **Higher Loan Recovery Rates**: Automated due date tracking and defaulter visibility encourage disciplined repayments.

---

### SLIDE 8: Future Scope & Roadmap

- **Phase 1 (Short-Term)**: Multilingual interface (Hindi, Marathi, Bengali, Tamil, Telugu, etc.) for non-English rural users.
- **Phase 2 (Medium-Term)**: SMS / WhatsApp transaction alerts and payment reminders via Twilio / Gupshup APIs.
- **Phase 3 (Long-Term)**: UPI & Jan Dhan Bank Account integration for direct digital disbursement and automated bank reconciliation.
- **Phase 4 (Offline-First)**: Progressive Web App (PWA) with local IndexedDB sync for zero-connectivity village meetings.

---

### SLIDE 9: Conclusion & References

#### Summary:
The **Self-Help Group Savings & Micro-Loan Tracker** bridges the digital divide in rural micro-finance by providing a transparent, trustworthy, and scalable financial management platform.

- **GitHub Repository**: [https://github.com/utkarshpatwa393-sys/SelfHelpProject-Ass-2-Web](https://github.com/utkarshpatwa393-sys/SelfHelpProject-Ass-2-Web)
- **Demo Access**: `http://localhost:3000` (Admin & Member Demo Portals)

**Thank You!**
*Questions & Feedback are welcome.*
