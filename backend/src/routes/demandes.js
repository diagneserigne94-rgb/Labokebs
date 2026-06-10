const express = require('express');
const router = express.Router();
const { query, getClient } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

const genererNumeroDemande = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const result = await query(
    `SELECT COUNT(*) FROM demandes WHERE EXTRACT(YEAR FROM date_demande) = $1 AND EXTRACT(MONTH FROM date_demande) = $2`,
    [year, parseInt(month)]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `DEM${year}${month}${String(count).padStart(4, '0')}`;
};

// GET /api/demandes
router.get('/', authenticate, async (req, res) => {
  try {
    const { statut, date_debut, date_fin, patient_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let sql = `SELECT d.*, 
      p.nom as patient_nom, p.prenom as patient_prenom, p.numero_dossier, p.sexe as patient_sexe,
      p.date_naissance,
      EXTRACT(YEAR FROM AGE(p.date_naissance)) as patient_age,
      u.nom as created_by_nom, u.prenom as created_by_prenom,
      COUNT(de.id) as nb_examens,
      COUNT(CASE WHEN de.statut = 'valide' THEN 1 END) as nb_valides
      FROM demandes d
      JOIN patients p ON p.id = d.patient_id
      LEFT JOIN utilisateurs u ON u.id = d.created_by
      LEFT JOIN demande_examens de ON de.demande_id = d.id
      WHERE 1=1`;
    if (statut) { params.push(statut); sql += ` AND d.statut = $${params.length}`; }
    if (patient_id) { params.push(patient_id); sql += ` AND d.patient_id = $${params.length}`; }
    if (date_debut) { params.push(date_debut); sql += ` AND d.date_demande >= $${params.length}`; }
    if (date_fin) { params.push(date_fin + ' 23:59:59'); sql += ` AND d.date_demande <= $${params.length}`; }
    sql += ` GROUP BY d.id, p.nom, p.prenom, p.numero_dossier, p.sexe, p.date_naissance, u.nom, u.prenom`;
    sql += ` ORDER BY d.date_demande DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    const result = await query(sql, params);

    let countSql = `SELECT COUNT(DISTINCT d.id) FROM demandes d WHERE 1=1`;
    const countParams = [];
    if (statut) { countParams.push(statut); countSql += ` AND d.statut = $${countParams.length}`; }
    if (patient_id) { countParams.push(patient_id); countSql += ` AND d.patient_id = $${countParams.length}`; }
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

// GET /api/demandes/:id avec examens et résultats
router.get('/:id', authenticate, async (req, res) => {
  try {
    const demande = await query(
      `SELECT d.*, p.nom as patient_nom, p.prenom as patient_prenom, p.numero_dossier,
        p.sexe as patient_sexe, p.date_naissance, p.telephone as patient_telephone, p.adresse as patient_adresse,
        EXTRACT(YEAR FROM AGE(p.date_naissance)) as patient_age,
        u.nom as created_by_nom, u.prenom as created_by_prenom
       FROM demandes d
       JOIN patients p ON p.id = d.patient_id
       LEFT JOIN utilisateurs u ON u.id = d.created_by
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (demande.rows.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });

    const examens = await query(
      `SELECT de.*, e.nom as examen_nom, e.code, e.categorie, e.unite, e.ref_homme, e.ref_femme, e.ref_enfant, e.type_resultat,
        r.id as resultat_id, r.valeur_numerique, r.valeur_qualitative, r.interpretation, r.commentaire,
        r.date_saisie, r.date_validation,
        us.nom as saisi_par_nom, us.prenom as saisi_par_prenom,
        uv.nom as valide_par_nom, uv.prenom as valide_par_prenom
       FROM demande_examens de
       JOIN examens e ON e.id = de.examen_id
       LEFT JOIN resultats r ON r.demande_examen_id = de.id
       LEFT JOIN utilisateurs us ON us.id = r.saisi_par
       LEFT JOIN utilisateurs uv ON uv.id = r.valide_par
       WHERE de.demande_id = $1
       ORDER BY e.categorie, e.nom`,
      [req.params.id]
    );

    res.json({ ...demande.rows[0], examens: examens.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/demandes
router.post('/', authenticate, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { patient_id, prescripteur, service_demandeur, type_prelevement, notes, examen_ids } = req.body;
    if (!patient_id || !examen_ids || examen_ids.length === 0) {
      return res.status(400).json({ message: 'Patient et au moins un examen sont requis' });
    }
    const numero = await genererNumeroDemande();
    const demande = await client.query(
      `INSERT INTO demandes (numero_demande, patient_id, prescripteur, service_demandeur, type_prelevement, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [numero, patient_id, prescripteur, service_demandeur, type_prelevement, notes, req.user.id]
    );
    for (const examen_id of examen_ids) {
      await client.query(
        `INSERT INTO demande_examens (demande_id, examen_id) VALUES ($1, $2)`,
        [demande.rows[0].id, examen_id]
      );
    }
    await client.query(
      `INSERT INTO journal_actions (utilisateur_id, action, table_cible, enregistrement_id, details)
       VALUES ($1, 'CREATION_DEMANDE', 'demandes', $2, $3)`,
      [req.user.id, demande.rows[0].id, JSON.stringify({ numero, nb_examens: examen_ids.length })]
    );
    await client.query('COMMIT');
    res.status(201).json(demande.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/demandes/:id/statut
router.put('/:id/statut', authenticate, async (req, res) => {
  try {
    const { statut } = req.body;
    const result = await query(
      `UPDATE demandes SET statut=$1 WHERE id=$2 RETURNING *`,
      [statut, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
