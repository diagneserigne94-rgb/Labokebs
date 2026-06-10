const express = require('express');
const router = express.Router();
const { query, getClient } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/resultats - Saisir résultats
router.post('/', authenticate, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { demande_examen_id, valeur_numerique, valeur_qualitative, unite, interpretation, commentaire } = req.body;
    if (!demande_examen_id) return res.status(400).json({ message: 'ID demande examen requis' });

    // Vérifier si résultat existe déjà
    const existing = await client.query('SELECT id FROM resultats WHERE demande_examen_id = $1', [demande_examen_id]);
    let result;
    if (existing.rows.length > 0) {
      result = await client.query(
        `UPDATE resultats SET valeur_numerique=$1, valeur_qualitative=$2, unite=$3, interpretation=$4,
         commentaire=$5, saisi_par=$6, date_saisie=NOW(), date_validation=NULL, valide_par=NULL
         WHERE demande_examen_id=$7 RETURNING *`,
        [valeur_numerique || null, valeur_qualitative, unite, interpretation, commentaire, req.user.id, demande_examen_id]
      );
    } else {
      result = await client.query(
        `INSERT INTO resultats (demande_examen_id, valeur_numerique, valeur_qualitative, unite, interpretation, commentaire, saisi_par, date_saisie)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
        [demande_examen_id, valeur_numerique || null, valeur_qualitative, unite, interpretation, commentaire, req.user.id]
      );
    }

    // Mettre à jour statut demande_examen
    await client.query(
      `UPDATE demande_examens SET statut = 'saisi' WHERE id = $1`,
      [demande_examen_id]
    );

    // Vérifier si la demande est complètement saisie → changer statut
    const demandeId = await client.query(
      `SELECT demande_id FROM demande_examens WHERE id = $1`, [demande_examen_id]
    );
    if (demandeId.rows.length > 0) {
      const stats = await client.query(
        `SELECT COUNT(*) total, COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) en_attente
         FROM demande_examens WHERE demande_id = $1`, [demandeId.rows[0].demande_id]
      );
      if (parseInt(stats.rows[0].en_attente) === 0) {
        await client.query(`UPDATE demandes SET statut = 'en_cours' WHERE id = $1 AND statut = 'en_attente'`,
          [demandeId.rows[0].demande_id]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// POST /api/resultats/valider-demande/:demandeId
router.post('/valider-demande/:demandeId', authenticate, authorize('technicien', 'administrateur'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { demandeId } = req.params;

    // Valider tous les résultats de la demande
    await client.query(
      `UPDATE resultats SET valide_par=$1, date_validation=NOW()
       WHERE demande_examen_id IN (SELECT id FROM demande_examens WHERE demande_id = $2)
       AND date_validation IS NULL`,
      [req.user.id, demandeId]
    );
    await client.query(`UPDATE demande_examens SET statut='valide' WHERE demande_id = $1`, [demandeId]);
    await client.query(`UPDATE demandes SET statut='valide' WHERE id = $1`, [demandeId]);

    await client.query(
      `INSERT INTO journal_actions (utilisateur_id, action, table_cible, enregistrement_id, details)
       VALUES ($1,'VALIDATION_DEMANDE','demandes',$2,$3)`,
      [req.user.id, demandeId, JSON.stringify({ validated_by: req.user.username })]
    );
    await client.query('COMMIT');
    res.json({ message: 'Résultats validés avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;
