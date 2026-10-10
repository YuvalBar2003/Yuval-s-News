function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  // אם משתמש לא קיים- יעביר אותו לעמןד התחברות
  return res.redirect('/login');
}

function isEditor(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'editor') {
    return next();
  }
  return res.status(403).send('גישה נדחתה: פעולה זו מותרת לעורכים בלבד');
}

function isReporter(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'reporter') {
    return next();
  }
  return res.status(403).send('גישה נדחתה: פעולה זו מותרת לכתבים בלבד');
}

module.exports = {
  isAuthenticated,
  isEditor,
  isReporter
};