const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const result = await query(`SELECT id, nom, prenom, username, role, email, telephone, actif, created_at FROM utilisateurs ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.post('/', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const { nom, prenom, username, password, role, email, telephone } = req.body;
    if (!nom || !prenom || !username || !password || !role) return res.status(400).json({ message: 'Tous les champs obligatoires requis' });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO utilisateurs (nom, prenom, username, password_hash, role, email, telephone) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, nom, prenom, username, role, email, telephone, actif`,
      [nom, prenom, username, hash, role, email, telephone]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Ce nom d\'utilisateur existe déjà' });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const { nom, prenom, role, email, telephone, actif } = req.body;
    const result = await query(
      `UPDATE utilisateurs SET nom=$1, prenom=$2, role=$3, email=$4, telephone=$5, actif=$6 WHERE id=$7 RETURNING id, nom, prenom, username, role, email, telephone, actif`,
      [nom, prenom, role, email, telephone, actif, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.post('/:id/reset-password', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE utilisateurs SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.get('/journal', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await query(
      `SELECT j.*, u.nom, u.prenom, u.username FROM journal_actions j LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id ORDER BY j.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    const total = await query('SELECT COUNT(*) FROM journal_actions');
    res.json({ data: result.rows, total: parseInt(total.rows[0].count) });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

module.exports = router;
