const sessionStore = require('../services/sessionStore');

function authenticate(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  const session = sessionStore.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = session.user;
  req.session = session;
  return next();
}

function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return function roleMiddleware(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Missing role' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    return next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
