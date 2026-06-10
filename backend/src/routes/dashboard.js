const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [patientsJour, analysesJour, enAttente, valides, mensuel, top5] = await Promise.all([
      query(`SELECT COUNT(DISTINCT patient_id) FROM demandes WHERE DATE(date_demande) = $1`, [today]),
      query(`SELECT COUNT(*) FROM demandes WHERE DATE(date_demande) = $1`, [today]),
      query(`SELECT COUNT(*) FROM demandes WHERE statut IN ('en_attente','en_cours')`),
      query(`SELECT COUNT(*) FROM demandes WHERE statut = 'valide' AND DATE(date_demande) = $1`, [today]),
      query(`SELECT 
        DATE_TRUNC('month', date_demande) as mois,
        COUNT(DISTINCT d.id) as nb_demandes,
        COUNT(DISTINCT d.patient_id) as nb_patients
       FROM demandes d
       WHERE date_demande >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', date_demande)
       ORDER BY mois ASC`),
      query(`SELECT e.nom, e.categorie, COUNT(de.id) as nb
       FROM demande_examens de
       JOIN examens e ON e.id = de.examen_id
       JOIN demandes d ON d.id = de.demande_id
       WHERE EXTRACT(YEAR FROM d.date_demande) = $1 AND EXTRACT(MONTH FROM d.date_demande) = $2
       GROUP BY e.id ORDER BY nb DESC LIMIT 5`, [year, month])
    ]);

    res.json({
      today: {
        patients: parseInt(patientsJour.rows[0].count),
        analyses: parseInt(analysesJour.rows[0].count),
        en_attente: parseInt(enAttente.rows[0].count),
        valides: parseInt(valides.rows[0].count)
      },
      mensuel: mensuel.rows,
      top5Examens: top5.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
