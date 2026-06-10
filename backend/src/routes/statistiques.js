const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// GET /api/statistiques
router.get('/', authenticate, async (req, res) => {
  try {
    const { annee = new Date().getFullYear(), mois } = req.query;
    let where = `WHERE EXTRACT(YEAR FROM d.date_demande) = $1`;
    const params = [annee];
    if (mois) { params.push(mois); where += ` AND EXTRACT(MONTH FROM d.date_demande) = $${params.length}`; }

    const [parMois, parExamen, parCategorie, totalPatients, totalAnalyses] = await Promise.all([
      query(`SELECT EXTRACT(MONTH FROM d.date_demande) as mois, TO_CHAR(d.date_demande,'TMMonth') as mois_nom,
        COUNT(DISTINCT d.id) as nb_demandes, COUNT(DISTINCT d.patient_id) as nb_patients,
        COUNT(de.id) as nb_examens
       FROM demandes d LEFT JOIN demande_examens de ON de.demande_id = d.id
       ${where} GROUP BY EXTRACT(MONTH FROM d.date_demande), TO_CHAR(d.date_demande,'TMMonth') ORDER BY mois`, params),
      query(`SELECT e.nom, e.categorie, COUNT(de.id) as nb
       FROM demande_examens de JOIN examens e ON e.id = de.examen_id
       JOIN demandes d ON d.id = de.demande_id ${where}
       GROUP BY e.id ORDER BY nb DESC LIMIT 10`, params),
      query(`SELECT e.categorie, COUNT(de.id) as nb
       FROM demande_examens de JOIN examens e ON e.id = de.examen_id
       JOIN demandes d ON d.id = de.demande_id ${where}
       GROUP BY e.categorie ORDER BY nb DESC`, params),
      query(`SELECT COUNT(DISTINCT patient_id) FROM demandes d ${where}`, params),
      query(`SELECT COUNT(de.id) FROM demande_examens de JOIN demandes d ON d.id = de.demande_id ${where}`, params)
    ]);

    res.json({
      parMois: parMois.rows,
      parExamen: parExamen.rows,
      parCategorie: parCategorie.rows,
      totalPatients: parseInt(totalPatients.rows[0].count),
      totalAnalyses: parseInt(totalAnalyses.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/statistiques/export-excel
router.get('/export-excel', authenticate, async (req, res) => {
  try {
    const { annee = new Date().getFullYear() } = req.query;
    const result = await query(
      `SELECT d.numero_demande, d.date_demande, p.nom, p.prenom, p.sexe, d.prescripteur,
        d.service_demandeur, e.nom as examen, e.categorie, d.statut
       FROM demandes d
       JOIN patients p ON p.id = d.patient_id
       JOIN demande_examens de ON de.demande_id = d.id
       JOIN examens e ON e.id = de.examen_id
       WHERE EXTRACT(YEAR FROM d.date_demande) = $1
       ORDER BY d.date_demande DESC`,
      [annee]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LaboKeb';
    const sheet = workbook.addWorksheet('Statistiques');

    sheet.mergeCells('A1:J1');
    sheet.getCell('A1').value = 'DISTRICT SANITAIRE DE KÉBÉMER - LABORATOIRE D\'ANALYSES MÉDICALES';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:J2');
    sheet.getCell('A2').value = `Registre des analyses - Année ${annee}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([]);
    sheet.addRow(['N° Demande','Date','Nom','Prénom','Sexe','Prescripteur','Service','Examen','Catégorie','Statut']);
    sheet.getRow(4).font = { bold: true };
    sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
    sheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' } };

    result.rows.forEach(r => {
      sheet.addRow([
        r.numero_demande,
        new Date(r.date_demande).toLocaleDateString('fr-FR'),
        r.nom, r.prenom, r.sexe, r.prescripteur || '',
        r.service_demandeur || '', r.examen, r.categorie, r.statut
      ]);
    });

    sheet.columns.forEach(col => { col.width = 18; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=labokeb-stats-${annee}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur export Excel' });
  }
});

module.exports = router;
