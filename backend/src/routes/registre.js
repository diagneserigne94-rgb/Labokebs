// ============================================================
// registre.js
// ============================================================
const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { date_debut, date_fin, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let sql = `SELECT d.numero_demande, d.date_demande, d.statut,
      p.nom, p.prenom, p.numero_dossier, p.sexe,
      EXTRACT(YEAR FROM AGE(p.date_naissance)) as age,
      d.prescripteur, d.service_demandeur, d.type_prelevement,
      COUNT(de.id) as nb_examens,
      u.nom as agent_nom, u.prenom as agent_prenom
      FROM demandes d
      JOIN patients p ON p.id = d.patient_id
      LEFT JOIN demande_examens de ON de.demande_id = d.id
      LEFT JOIN utilisateurs u ON u.id = d.created_by
      WHERE 1=1`;
    if (date_debut) { params.push(date_debut); sql += ` AND DATE(d.date_demande) >= $${params.length}`; }
    if (date_fin) { params.push(date_fin); sql += ` AND DATE(d.date_demande) <= $${params.length}`; }
    sql += ` GROUP BY d.id, p.nom, p.prenom, p.numero_dossier, p.sexe, p.date_naissance, u.nom, u.prenom`;
    sql += ` ORDER BY d.date_demande DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    const result = await query(sql, params);
    const total = await query(`SELECT COUNT(DISTINCT d.id) FROM demandes d WHERE 1=1${date_debut ? ` AND DATE(d.date_demande) >= '${date_debut}'` : ''}${date_fin ? ` AND DATE(d.date_demande) <= '${date_fin}'` : ''}`);
    res.json({ data: result.rows, total: parseInt(total.rows[0].count), page: parseInt(page), totalPages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
