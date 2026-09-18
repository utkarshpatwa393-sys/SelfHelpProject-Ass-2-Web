// ==========================================================
// SELF-HELP GROUP TRACKER - CLIENT-SIDE JAVASCRIPT
// Simple, beginner-friendly helper functions
// ==========================================================

// Helper to fill login credentials quickly during demo
function fillLogin(email, password) {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  if (emailInput && passwordInput) {
    emailInput.value = email;
    passwordInput.value = password;
  }
}

// Live Loan Interest & EMI Calculator Preview for Loan Request Page
document.addEventListener("DOMContentLoaded", function () {
  const amountInput = document.getElementById("loan-amount");
  const tenureInput = document.getElementById("loan-tenure");
  const interestRate = 5; // 5% annual interest

  const previewPrincipal = document.getElementById("preview-principal");
  const previewInterest = document.getElementById("preview-interest");
  const previewTotal = document.getElementById("preview-total");
  const previewEmi = document.getElementById("preview-emi");

  function updateLoanCalculation() {
    if (!amountInput || !tenureInput || !previewPrincipal) return;

    const principal = parseFloat(amountInput.value) || 0;
    const tenureMonths = parseInt(tenureInput.value, 10) || 0;

    if (principal > 0 && tenureMonths > 0) {
      // Formula: Simple Interest = (P * R * (T / 12)) / 100
      const timeInYears = tenureMonths / 12;
      const interest = (principal * interestRate * timeInYears) / 100;
      const totalPayable = principal + interest;
      const monthlyEmi = totalPayable / tenureMonths;

      previewPrincipal.innerText = "₹" + principal.toLocaleString("en-IN");
      previewInterest.innerText = "₹" + Math.round(interest).toLocaleString("en-IN");
      previewTotal.innerText = "₹" + Math.round(totalPayable).toLocaleString("en-IN");
      previewEmi.innerText = "₹" + Math.round(monthlyEmi).toLocaleString("en-IN");
    } else {
      previewPrincipal.innerText = "₹0";
      previewInterest.innerText = "₹0";
      previewTotal.innerText = "₹0";
      previewEmi.innerText = "₹0";
    }
  }

  if (amountInput && tenureInput) {
    amountInput.addEventListener("input", updateLoanCalculation);
    tenureInput.addEventListener("input", updateLoanCalculation);
    updateLoanCalculation();
  }
});
