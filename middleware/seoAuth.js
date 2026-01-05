/**
 * SEO Admin Authentication Middleware
 * Separate authentication for SEO specialists
 */

// Check if SEO user is authenticated
const requireSeoAuth = (req, res, next) => {
  if (req.session.isSeoAuthenticated) {
    return next();
  }
  // Store the originally requested URL
  req.session.seoReturnTo = req.originalUrl;
  res.redirect('/admin/seo-login');
};

// Check if user is already logged in (for login page redirect)
const redirectIfSeoAuthenticated = (req, res, next) => {
  if (req.session.isSeoAuthenticated) {
    return res.redirect('/admin/seo-panel');
  }
  next();
};

module.exports = {
  requireSeoAuth,
  redirectIfSeoAuthenticated
};
