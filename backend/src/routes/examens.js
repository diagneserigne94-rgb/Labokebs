const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/examens
router.get('/', authenticate, async (req, res) => {
  try {
    const { categorie, search, actif } = req.query;
    const params = [];
    let sql = `SELECT * FROM examens WHERE 1=1`;
    if (actif !== undefined) { params.push(actif === 'true'); sql += ` AND actif = $${params.length}`; }
    if (categorie) { params.push(categorie); sql += ` AND categorie = $${params.length}`; }
    if (search) { params.push(`%${search}%`); sql += ` AND (nom ILIKE $${params.length} OR code ILIKE $${params.length})`; }
    sql += ` ORDER BY categorie, nom`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/examens/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM examens WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Examen non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/examens
router.post('/', authenticate, authorize('administrateur', 'technicien'), async (req, res) => {
  try {
    const { code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat } = req.body;
    if (!code || !nom || !categorie) return res.status(400).json({ message: 'Code, nom et catégorie requis' });
    const result = await query(
      `INSERT INTO examens (code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix || 0, delai_rendu, type_resultat || 'numerique']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Ce code examen existe déjà' });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/examens/:id
router.put('/:id', authenticate, authorize('administrateur', 'technicien'), async (req, res) => {
  try {
    const { code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat, actif } = req.body;
    const result = await query(
      `UPDATE examens SET code=$1, nom=$2, categorie=$3, unite=$4, ref_homme=$5, ref_femme=$6,
       ref_enfant=$7, prix=$8, delai_rendu=$9, type_resultat=$10, actif=$11 WHERE id=$12 RETURNING *`,
      [code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat, actif !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Examen non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/examens/:id
router.delete('/:id', authenticate, authorize('administrateur'), async (req, res) => {
  try {
    await query('UPDATE examens SET actif = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Examen désactivé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
