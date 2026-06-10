// parametres.js
const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM parametres ORDER BY cle');
    const params = {};
    result.rows.forEach(r => { params[r.cle] = r.valeur; });
    res.json(params);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.put('/:cle', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const { valeur } = req.body;
    await query(`INSERT INTO parametres (cle, valeur) VALUES ($1,$2) ON CONFLICT (cle) DO UPDATE SET valeur=$2, updated_at=NOW()`, [req.params.cle, valeur]);
    res.json({ message: 'Paramètre mis à jour' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

module.exports = router;
