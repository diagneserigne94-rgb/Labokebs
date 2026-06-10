const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token d\'authentification requis' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, nom, prenom, username, role, actif FROM utilisateurs WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0 || !result.rows[0].actif) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou désactivé' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé pour ce rôle' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
