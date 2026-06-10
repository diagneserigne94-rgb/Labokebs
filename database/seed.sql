-- ============================================================
-- LaboKeb - Données initiales
-- ============================================================

-- Utilisateur administrateur par défaut (mot de passe: Admin@2024)
INSERT INTO utilisateurs (nom, prenom, username, password_hash, role, email, telephone) VALUES
('Admin', 'LaboKeb', 'admin', '$2b$10$rK8mXzJvQpL9nWxYsDfGaO3kT1uBmCeNpQsRvWyHjAlIoMnUbVxDe', 'administrateur', 'districtkebemer2022@gmail.com', '780592094'),
('Diallo', 'Moussa', 'technicien', '$2b$10$rK8mXzJvQpL9nWxYsDfGaO3kT1uBmCeNpQsRvWyHjAlIoMnUbVxDe', 'technicien', 'technicien@labokeb.sn', '760000001'),
('Fall', 'Aminata', 'receptionniste', '$2b$10$rK8mXzJvQpL9nWxYsDfGaO3kT1uBmCeNpQsRvWyHjAlIoMnUbVxDe', 'receptionniste', 'reception@labokeb.sn', '760000002')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- CATALOGUE DES EXAMENS
-- ============================================================

-- BIOCHIMIE
INSERT INTO examens (code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat) VALUES
('BIO001', 'Glycémie', 'Biochimie', 'g/L', '0.70 - 1.10', '0.70 - 1.10', '0.60 - 1.00', 1500, '1 heure', 'numerique'),
('BIO002', 'Glycémie post-prandiale', 'Biochimie', 'g/L', '< 1.40', '< 1.40', '< 1.40', 1500, '1 heure', 'numerique'),
('BIO003', 'Urée', 'Biochimie', 'g/L', '0.15 - 0.45', '0.15 - 0.45', '0.10 - 0.35', 2000, '2 heures', 'numerique'),
('BIO004', 'Azotémie', 'Biochimie', 'mmol/L', '3.0 - 8.0', '3.0 - 8.0', '2.5 - 6.5', 2000, '2 heures', 'numerique'),
('BIO005', 'Créatininémie', 'Biochimie', 'mg/L', '7 - 13', '6 - 10', '3 - 8', 2000, '2 heures', 'numerique'),
('BIO006', 'Uricémie', 'Biochimie', 'mg/L', '35 - 70', '25 - 55', '20 - 50', 2000, '2 heures', 'numerique'),
('BIO007', 'Calcémie', 'Biochimie', 'mg/L', '85 - 105', '85 - 105', '80 - 110', 2500, '2 heures', 'numerique'),
('BIO008', 'Magnésémie', 'Biochimie', 'mg/L', '17 - 25', '17 - 25', '15 - 25', 2500, '2 heures', 'numerique'),
('BIO009', 'ASAT', 'Biochimie', 'UI/L', '< 37', '< 31', '< 40', 2500, '2 heures', 'numerique'),
('BIO010', 'ALAT', 'Biochimie', 'UI/L', '< 41', '< 31', '< 35', 2500, '2 heures', 'numerique'),
('BIO011', 'Triglycérides', 'Biochimie', 'g/L', '< 1.50', '< 1.50', '< 1.30', 2500, '2 heures', 'numerique'),
('BIO012', 'Cholestérol total', 'Biochimie', 'g/L', '< 2.00', '< 2.00', '< 1.70', 2000, '2 heures', 'numerique'),
('BIO013', 'HDL Cholestérol', 'Biochimie', 'g/L', '> 0.40', '> 0.50', '> 0.40', 2500, '2 heures', 'numerique'),
('BIO014', 'LDL Cholestérol', 'Biochimie', 'g/L', '< 1.60', '< 1.60', '< 1.30', 2500, '2 heures', 'numerique'),
('BIO015', 'HbA1c', 'Biochimie', '%', '< 6.5', '< 6.5', '< 6.0', 5000, '24 heures', 'numerique'),
('BIO016', 'Phosphorémie', 'Biochimie', 'mg/L', '25 - 45', '25 - 45', '40 - 70', 2000, 2000, '2 heures', 'numerique'),
('BIO017', 'Albuminémie', 'Biochimie', 'g/L', '35 - 50', '35 - 50', '30 - 50', 2500, '2 heures', 'numerique')
ON CONFLICT (code) DO NOTHING;

-- HÉMATOLOGIE
INSERT INTO examens (code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat) VALUES
('HEM001', 'NFS (Numération Formule Sanguine)', 'Hématologie', '', 'Hémoglobine: 13-17 g/dL, GB: 4000-10000/mm³, Plaquettes: 150000-400000/mm³', 'Hémoglobine: 12-16 g/dL, GB: 4000-10000/mm³, Plaquettes: 150000-400000/mm³', 'Selon âge', 3000, '2 heures', 'mixte'),
('HEM002', 'Groupe sanguin Rhésus', 'Hématologie', '', 'A/B/AB/O RH+/-', 'A/B/AB/O RH+/-', 'A/B/AB/O RH+/-', 2000, '1 heure', 'qualitatif'),
('HEM003', 'Test d''Emmel (Drépanocytose)', 'Hématologie', '', 'Négatif', 'Négatif', 'Négatif', 2500, '2 heures', 'qualitatif'),
('HEM004', 'Vitesse de sédimentation (VS)', 'Hématologie', 'mm/h', '< 15', '< 20', '< 10', 1500, '1 heure', 'numerique'),
('HEM005', 'TP (Taux de Prothrombine)', 'Hématologie', '%', '70 - 100', '70 - 100', '70 - 100', 3000, '3 heures', 'numerique'),
('HEM006', 'INR', 'Hématologie', '', '0.8 - 1.2', '0.8 - 1.2', '0.8 - 1.2', 3000, '3 heures', 'numerique'),
('HEM007', 'TCA (TCK)', 'Hématologie', 'secondes', '28 - 38', '28 - 38', '28 - 38', 3000, '3 heures', 'numerique')
ON CONFLICT (code) DO NOTHING;

-- SÉROLOGIE / IMMUNOLOGIE
INSERT INTO examens (code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat) VALUES
('SER001', 'Ag HBs (Antigène HBs)', 'Sérologie/Immunologie', '', 'Négatif', 'Négatif', 'Négatif', 3000, '1 heure', 'qualitatif'),
('SER002', 'CRP (Protéine C Réactive)', 'Sérologie/Immunologie', 'mg/L', '< 6', '< 6', '< 6', 2500, '1 heure', 'numerique'),
('SER003', 'ASLO', 'Sérologie/Immunologie', 'UI/mL', '< 200', '< 200', '< 200', 3000, '2 heures', 'numerique'),
('SER004', 'VIH (Test rapide)', 'Sérologie/Immunologie', '', 'Négatif', 'Négatif', 'Négatif', 3000, '1 heure', 'qualitatif'),
('SER005', 'Syphilis (BW/VDRL)', 'Sérologie/Immunologie', '', 'Négatif', 'Négatif', 'Négatif', 2500, '2 heures', 'qualitatif'),
('SER006', 'Toxoplasmose (IgG/IgM)', 'Sérologie/Immunologie', 'UI/mL', 'IgG < 8, IgM Négatif', 'IgG < 8, IgM Négatif', 'IgG < 8, IgM Négatif', 5000, '24 heures', 'numerique'),
('SER007', 'Rubéole (IgG/IgM)', 'Sérologie/Immunologie', 'UI/mL', 'Variable', 'Variable', 'Variable', 5000, '24 heures', 'numerique'),
('SER008', 'Test de grossesse', 'Sérologie/Immunologie', '', 'N/A', 'Négatif', 'N/A', 1500, '30 min', 'qualitatif'),
('SER009', 'Widal et Félix', 'Sérologie/Immunologie', '', '< 1/100', '< 1/100', '< 1/100', 3000, '2 heures', 'qualitatif')
ON CONFLICT (code) DO NOTHING;

-- BACTÉRIOLOGIE / PARASITOLOGIE
INSERT INTO examens (code, nom, categorie, unite, ref_homme, ref_femme, ref_enfant, prix, delai_rendu, type_resultat) VALUES
('BAC001', 'Goutte épaisse / TDR Paludisme', 'Bactériologie/Parasitologie', '', 'Négatif', 'Négatif', 'Négatif', 1500, '1 heure', 'qualitatif'),
('BAC002', 'ECBU (Examen Cytobactériologique Urinaire)', 'Bactériologie/Parasitologie', '', 'Leucocytes < 10/mm³, Absence de germes', 'Leucocytes < 10/mm³, Absence de germes', 'Leucocytes < 10/mm³, Absence de germes', 5000, '48 heures', 'mixte')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- PARAMÈTRES SYSTÈME
-- ============================================================
INSERT INTO parametres (cle, valeur, description) VALUES
('etablissement_nom', 'District Sanitaire de Kébémer', 'Nom de l''établissement'),
('labo_nom', 'Laboratoire d''Analyses Médicales', 'Nom du laboratoire'),
('adresse', 'Quartier Escale, Kébémer - BP : 30', 'Adresse'),
('telephone1', '78 059 20 94', 'Téléphone 1'),
('telephone2', '76 784 86 32 55', 'Téléphone 2'),
('email', 'districtkebemer2022@gmail.com', 'Email'),
('pays', 'SÉNÉGAL', 'Pays'),
('ministere', 'MINISTÈRE DE LA SANTÉ ET DE L''ACTION SOCIALE', 'Ministère de tutelle'),
('republique', 'RÉPUBLIQUE DU SÉNÉGAL', 'État'),
('sauvegarde_auto', 'true', 'Sauvegarde automatique activée'),
('sauvegarde_heure', '23:00', 'Heure de sauvegarde automatique'),
('prefix_dossier', 'PAT', 'Préfixe numéro de dossier'),
('prefix_demande', 'DEM', 'Préfixe numéro de demande')
ON CONFLICT (cle) DO NOTHING;
