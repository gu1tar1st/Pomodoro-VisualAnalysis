function setUser(req, res, next) {
  // Passport puts the logged-in user on req.user
  res.locals.user = req.user || null;
  next();
}

module.exports = setUser;