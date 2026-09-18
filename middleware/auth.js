// Middleware to ensure a user is logged in
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?error=" + encodeURIComponent("Please log in to continue."));
  }
  next();
}

// Middleware to restrict route to Admin role only
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?error=" + encodeURIComponent("Please log in as Admin."));
  }
  if (req.session.user.role !== "Admin") {
    return res.redirect("/member/dashboard?error=" + encodeURIComponent("Access denied. Admin privileges required."));
  }
  next();
}

// Middleware to restrict route to Member role only
function requireMember(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?error=" + encodeURIComponent("Please log in as Member."));
  }
  if (req.session.user.role !== "Member") {
    return res.redirect("/admin/dashboard?error=" + encodeURIComponent("Admins should use the Admin dashboard."));
  }
  next();
}

module.exports = {
  requireLogin,
  requireAdmin,
  requireMember,
};
