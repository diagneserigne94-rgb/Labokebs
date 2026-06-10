const { query } = require('../../config/database');

const logAction = (action, tableCible) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (res.statusCode < 400 && req.user) {
        try {
          await query(
            `INSERT INTO journal_actions (utilisateur_id, action, table_cible, enregistrement_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              req.user.id,
              action,
              tableCible,
              data?.data?.id || data?.id || null,
              JSON.stringify({ method: req.method, path: req.path, body: req.body }),
              req.ip
            ]
          );
        } catch (err) {
          console.error('Erreur journal:', err);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { logAction };
