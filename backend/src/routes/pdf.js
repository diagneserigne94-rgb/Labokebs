const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

const COLORS = {
  primary: '#1E3A5F',
  secondary: '#2E86AB',
  accent: '#E63946',
  green: '#2D6A4F',
  light: '#F8F9FA',
  border: '#DEE2E6',
  text: '#212529'
};

// GET /api/pdf/resultat/:demandeId
router.get('/resultat/:demandeId', authenticate, async (req, res) => {
  try {
    const demande = await query(
      `SELECT d.*, 
        p.nom as patient_nom, p.prenom as patient_prenom, p.numero_dossier,
        p.sexe as patient_sexe, p.date_naissance, p.telephone as patient_telephone, p.adresse as patient_adresse,
        EXTRACT(YEAR FROM AGE(p.date_naissance)) as patient_age,
        uv.nom as valide_par_nom, uv.prenom as valide_par_prenom
       FROM demandes d
       JOIN patients p ON p.id = d.patient_id
       LEFT JOIN utilisateurs uv ON uv.id = (
         SELECT r.valide_par FROM resultats r
         JOIN demande_examens de ON de.id = r.demande_examen_id
         WHERE de.demande_id = d.id AND r.valide_par IS NOT NULL LIMIT 1
       )
       WHERE d.id = $1`,
      [req.params.demandeId]
    );
    if (demande.rows.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });
    const d = demande.rows[0];

    const examens = await query(
      `SELECT e.nom as examen_nom, e.categorie, e.unite, e.ref_homme, e.ref_femme, e.ref_enfant, e.type_resultat,
        r.valeur_numerique, r.valeur_qualitative, r.interpretation, r.commentaire, r.date_validation
       FROM demande_examens de
       JOIN examens e ON e.id = de.examen_id
       LEFT JOIN resultats r ON r.demande_examen_id = de.id
       WHERE de.demande_id = $1 ORDER BY e.categorie, e.nom`,
      [req.params.demandeId]
    );

    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=resultat-${d.numero_demande}.pdf`);
    doc.pipe(res);

    const pageW = doc.page.width - 70;

    // ── EN-TÊTE INSTITUTIONNEL ──
    // Bandeau bleu
    doc.rect(35, 35, pageW, 80).fill(COLORS.primary);

    // Colonne gauche: République
    doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica')
       .text('RÉPUBLIQUE DU SÉNÉGAL', 45, 45, { width: pageW / 2 });
    doc.fontSize(7).text('MINISTÈRE DE LA SANTÉ ET DE L\'ACTION SOCIALE', 45, 56, { width: pageW / 2 });

    // Centre: Titre principal
    doc.fontSize(12).font('Helvetica-Bold')
       .text('DISTRICT SANITAIRE DE KÉBÉMER', 35, 50, { width: pageW, align: 'center' });
    doc.fontSize(10).font('Helvetica')
       .text('Laboratoire d\'Analyses Médicales', 35, 66, { width: pageW, align: 'center' });

    // Colonne droite: Coordonnées
    doc.fontSize(6.5).font('Helvetica')
       .text('Quartier Escale - BP : 30', 35 + pageW / 2, 45, { width: pageW / 2, align: 'right' })
       .text('Tél : 78 059 20 94 / 76 784 86 32 55', 35 + pageW / 2, 55, { width: pageW / 2, align: 'right' })
       .text('districtkebemer2022@gmail.com', 35 + pageW / 2, 65, { width: pageW / 2, align: 'right' });

    // Sous-bandeau vert
    doc.rect(35, 115, pageW, 16).fill(COLORS.secondary);
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
       .text('BULLETIN DE RÉSULTATS D\'ANALYSES', 35, 119, { width: pageW, align: 'center' });

    // ── INFORMATIONS PATIENT ──
    const infoY = 140;
    doc.rect(35, infoY, pageW, 14).fill(COLORS.primary);
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
       .text('INFORMATIONS DU PATIENT', 40, infoY + 3);

    doc.rect(35, infoY + 14, pageW, 58).fill(COLORS.light).stroke(COLORS.border);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(8.5);

    const age = d.patient_age ? `${d.patient_age} ans` : 'N/D';
    const dob = d.date_naissance ? new Date(d.date_naissance).toLocaleDateString('fr-FR') : 'N/D';
    const col1X = 40, col2X = 35 + pageW / 2 + 5;
    const row1Y = infoY + 20, row2Y = infoY + 33, row3Y = infoY + 46;

    doc.font('Helvetica-Bold').text('N° Dossier :', col1X, row1Y).font('Helvetica').text(d.numero_dossier, col1X + 68, row1Y);
    doc.font('Helvetica-Bold').text('N° Demande :', col2X, row1Y).font('Helvetica').text(d.numero_demande, col2X + 73, row1Y);
    doc.font('Helvetica-Bold').text('Patient :', col1X, row2Y).font('Helvetica').text(`${d.patient_nom} ${d.patient_prenom}`, col1X + 68, row2Y);
    doc.font('Helvetica-Bold').text('Sexe / Âge :', col2X, row2Y).font('Helvetica').text(`${d.patient_sexe} / ${age}`, col2X + 73, row2Y);
    doc.font('Helvetica-Bold').text('Date naissance :', col1X, row3Y).font('Helvetica').text(dob, col1X + 68, row3Y);
    doc.font('Helvetica-Bold').text('Prescripteur :', col2X, row3Y).font('Helvetica').text(d.prescripteur || 'N/D', col2X + 73, row3Y);

    const demandeDateStr = new Date(d.date_demande).toLocaleDateString('fr-FR') + ' ' + new Date(d.date_demande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    doc.font('Helvetica-Bold').text('Service :', col1X, infoY + 59).font('Helvetica').text(d.service_demandeur || 'N/D', col1X + 68, infoY + 59);
    doc.font('Helvetica-Bold').text('Date prélèvement :', col2X, infoY + 59).font('Helvetica').text(demandeDateStr, col2X + 73, infoY + 59);

    // ── RÉSULTATS ──
    let y = infoY + 85;
    doc.rect(35, y, pageW, 14).fill(COLORS.primary);
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text('RÉSULTATS DES EXAMENS', 40, y + 3);
    y += 14;

    // Entête tableau
    doc.rect(35, y, pageW, 13).fill(COLORS.secondary);
    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
    doc.text('EXAMEN', 40, y + 3, { width: 160 });
    doc.text('RÉSULTAT', 200, y + 3, { width: 80 });
    doc.text('UNITÉ', 280, y + 3, { width: 60 });
    doc.text('VALEURS DE RÉFÉRENCE', 340, y + 3, { width: 160 });
    doc.text('INTERP.', 500, y + 3, { width: 60 });
    y += 13;

    const groupes = {};
    examens.rows.forEach(e => {
      if (!groupes[e.categorie]) groupes[e.categorie] = [];
      groupes[e.categorie].push(e);
    });

    let rowAlt = false;
    Object.entries(groupes).forEach(([categorie, lignes]) => {
      // Ligne catégorie
      if (y > 720) { doc.addPage(); y = 35; }
      doc.rect(35, y, pageW, 12).fill('#E8EEF4');
      doc.fillColor(COLORS.primary).fontSize(8).font('Helvetica-Bold')
         .text(`▸ ${categorie.toUpperCase()}`, 40, y + 2);
      y += 12;

      lignes.forEach(e => {
        if (y > 720) { doc.addPage(); y = 35; }
        const bg = rowAlt ? '#F8F9FA' : '#FFFFFF';
        doc.rect(35, y, pageW, 14).fill(bg).stroke(COLORS.border);

        const valeur = e.valeur_numerique !== null ? e.valeur_numerique : (e.valeur_qualitative || '—');
        const ref = e.patient_sexe === 'Féminin' ? e.ref_femme : e.ref_homme;
        const interpColor = e.interpretation === 'eleve' || e.interpretation === 'positif' ? COLORS.accent :
                            e.interpretation === 'bas' ? '#FF8C00' : COLORS.green;

        doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5);
        doc.text(e.examen_nom, 40, y + 3, { width: 158, ellipsis: true });
        doc.font(e.interpretation === 'eleve' || e.interpretation === 'bas' ? 'Helvetica-Bold' : 'Helvetica')
           .fillColor(e.interpretation === 'eleve' || e.interpretation === 'bas' ? COLORS.accent : COLORS.text)
           .text(String(valeur), 200, y + 3, { width: 78 });
        doc.fillColor(COLORS.text).font('Helvetica')
           .text(e.unite || '', 280, y + 3, { width: 58 })
           .text(ref || 'Voir notice', 340, y + 3, { width: 158, ellipsis: true });
        if (e.interpretation) {
          const interpLabel = { normal: '✓ Normal', bas: '▼ Bas', eleve: '▲ Élevé', positif: '+ Positif', negatif: '- Négatif', douteux: '? Douteux' };
          doc.fillColor(interpColor).font('Helvetica-Bold').text(interpLabel[e.interpretation] || e.interpretation, 500, y + 3, { width: 58 });
        }
        if (e.commentaire) {
          y += 14;
          doc.rect(35, y, pageW, 10).fill('#FFFBF0');
          doc.fillColor('#6C757D').fontSize(7).font('Helvetica-Oblique').text(`  ▸ ${e.commentaire}`, 40, y + 1.5, { width: pageW - 10 });
        }
        y += 14;
        rowAlt = !rowAlt;
      });
    });

    // ── VALIDATION ──
    y += 10;
    if (y > 680) { doc.addPage(); y = 35; }
    doc.rect(35, y, pageW, 60).fill(COLORS.light).stroke(COLORS.border);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(8);
    const valide = d.valide_par_nom ? `${d.valide_par_prenom} ${d.valide_par_nom}` : 'Non validé';
    doc.text(`Résultats validés par : ${valide}`, 45, y + 10);
    doc.text(`Date de validation : ${new Date().toLocaleDateString('fr-FR')}`, 45, y + 23);
    doc.font('Helvetica-Bold').text('Signature & Cachet :', 35 + pageW - 200, y + 10);
    doc.rect(35 + pageW - 200, y + 22, 170, 30).stroke(COLORS.border);

    // ── PIED DE PAGE ──
    const footY = doc.page.height - 40;
    doc.rect(35, footY - 5, pageW, 0.5).fill(COLORS.border);
    doc.fillColor('#6C757D').fontSize(7).font('Helvetica')
       .text(`District Sanitaire de Kébémer | Quartier Escale, BP 30 | Tél : 78 059 20 94 | districtkebemer2022@gmail.com`, 35, footY, { width: pageW, align: 'center' })
       .text(`Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - LaboKeb v1.0`, 35, footY + 10, { width: pageW, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erreur PDF:', error);
    res.status(500).json({ message: 'Erreur génération PDF' });
  }
});

module.exports = router;
