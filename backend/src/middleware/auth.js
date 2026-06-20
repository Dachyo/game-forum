// Простая защита маршрутов: пускаем дальше только авторизованных пользователей
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// Прокидываем данные текущего пользователя во все шаблоны (для шапки сайта)
function attachUser(req, res, next) {
  res.locals.currentUser = req.session.username || null;
  next();
}

module.exports = { requireAuth, attachUser };
