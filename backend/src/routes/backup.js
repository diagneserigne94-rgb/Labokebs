const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { createBackup } = require('../utils/backup');

router.post('/create', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const result = await createBackup(req.user.id, 'manuelle');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur sauvegarde: ' + error.message });
  }
});

router.get('/list', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM sauvegardes ORDER BY created_at DESC LIMIT 20');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

module.exports = router;
