function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function attachUser(req, res, next) {
  res.locals.currentUser = req.session.username || null;
  next();
}

module.exports = { requireAuth, attachUser };
