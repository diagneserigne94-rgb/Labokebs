const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

// Générer numéro dossier
const genererNumeroDossier = async () => {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) FROM patients WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `PAT${year}${String(count).padStart(5, '0')}`;
};

// GET /api/patients - Liste avec recherche
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let sql = `SELECT p.*, 
      EXTRACT(YEAR FROM AGE(p.date_naissance)) as age,
      COUNT(d.id) as nb_demandes
      FROM patients p
      LEFT JOIN demandes d ON d.patient_id = p.id
      WHERE 1=1`;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.nom ILIKE $${params.length} OR p.prenom ILIKE $${params.length} OR p.numero_dossier ILIKE $${params.length} OR p.telephone ILIKE $${params.length})`;
    }
    sql += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    const result = await query(sql, params);

    // Total count
    let countSql = 'SELECT COUNT(*) FROM patients WHERE 1=1';
    const countParams = [];
    if (search) {
      countParams.push(`%${search}%`);
      countSql += ` AND (nom ILIKE $1 OR prenom ILIKE $1 OR numero_dossier ILIKE $1 OR telephone ILIKE $1)`;
    }
    const total = await query(countSql, countParams);

    res.json({
      data: result.rows,
      total: parseInt(total.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT *, EXTRACT(YEAR FROM AGE(date_naissance)) as age FROM patients WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Patient non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/patients - Créer patient
router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, prenom, sexe, date_naissance, telephone, adresse } = req.body;
    if (!nom || !prenom || !sexe) {
      return res.status(400).json({ message: 'Nom, prénom et sexe sont obligatoires' });
    }
    const numero = await genererNumeroDossier();
    const result = await query(
      `INSERT INTO patients (numero_dossier, nom, prenom, sexe, date_naissance, telephone, adresse)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *, EXTRACT(YEAR FROM AGE(date_naissance)) as age`,
      [numero, nom.toUpperCase(), prenom, sexe, date_naissance || null, telephone, adresse]
    );
    await query(
      `INSERT INTO journal_actions (utilisateur_id, action, table_cible, enregistrement_id, details)
       VALUES ($1, 'CREATION_PATIENT', 'patients', $2, $3)`,
      [req.user.id, result.rows[0].id, JSON.stringify({ numero, nom, prenom })]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/patients/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nom, prenom, sexe, date_naissance, telephone, adresse } = req.body;
    const result = await query(
      `UPDATE patients SET nom=$1, prenom=$2, sexe=$3, date_naissance=$4, telephone=$5, adresse=$6
       WHERE id=$7 RETURNING *, EXTRACT(YEAR FROM AGE(date_naissance)) as age`,
      [nom.toUpperCase(), prenom, sexe, date_naissance || null, telephone, adresse, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Patient non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/patients/:id/demandes
router.get('/:id/demandes', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.nom as created_by_nom, u.prenom as created_by_prenom,
        COUNT(de.id) as nb_examens
       FROM demandes d
       LEFT JOIN utilisateurs u ON u.id = d.created_by
       LEFT JOIN demande_examens de ON de.demande_id = d.id
       WHERE d.patient_id = $1
       GROUP BY d.id, u.nom, u.prenom
       ORDER BY d.date_demande DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
