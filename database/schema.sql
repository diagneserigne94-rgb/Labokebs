-- ============================================================
-- LaboKeb - Base de données PostgreSQL
-- District Sanitaire de Kébémer - Sénégal
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('administrateur', 'technicien', 'receptionniste')),
    email VARCHAR(150),
    telephone VARCHAR(20),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_dossier VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe VARCHAR(10) NOT NULL CHECK (sexe IN ('Masculin', 'Féminin')),
    date_naissance DATE,
    telephone VARCHAR(20),
    adresse TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: examens (catalogue)
-- ============================================================
CREATE TABLE IF NOT EXISTS examens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(200) NOT NULL,
    categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('Biochimie', 'Hématologie', 'Sérologie/Immunologie', 'Bactériologie/Parasitologie')),
    unite VARCHAR(50),
    ref_homme VARCHAR(100),
    ref_femme VARCHAR(100),
    ref_enfant VARCHAR(100),
    prix DECIMAL(10,2) DEFAULT 0,
    delai_rendu VARCHAR(50),
    type_resultat VARCHAR(20) DEFAULT 'numerique' CHECK (type_resultat IN ('numerique', 'qualitatif', 'mixte')),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: demandes
-- ============================================================
CREATE TABLE IF NOT EXISTS demandes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_demande VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    prescripteur VARCHAR(150),
    service_demandeur VARCHAR(150),
    type_prelevement VARCHAR(100),
    date_demande TIMESTAMP DEFAULT NOW(),
    statut VARCHAR(30) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'valide', 'archive')),
    notes TEXT,
    created_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: demande_examens (pivot)
-- ============================================================
CREATE TABLE IF NOT EXISTS demande_examens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    examen_id UUID NOT NULL REFERENCES examens(id) ON DELETE RESTRICT,
    statut VARCHAR(30) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'saisi', 'valide')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: resultats
-- ============================================================
CREATE TABLE IF NOT EXISTS resultats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demande_examen_id UUID NOT NULL REFERENCES demande_examens(id) ON DELETE CASCADE,
    valeur_numerique DECIMAL(15,4),
    valeur_qualitative VARCHAR(500),
    unite VARCHAR(50),
    interpretation VARCHAR(100) CHECK (interpretation IN ('normal', 'bas', 'eleve', 'positif', 'negatif', 'douteux', NULL)),
    commentaire TEXT,
    saisi_par UUID REFERENCES utilisateurs(id),
    valide_par UUID REFERENCES utilisateurs(id),
    date_saisie TIMESTAMP,
    date_validation TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: journal_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    action VARCHAR(100) NOT NULL,
    table_cible VARCHAR(50),
    enregistrement_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: sauvegardes
-- ============================================================
CREATE TABLE IF NOT EXISTS sauvegardes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_fichier VARCHAR(255) NOT NULL,
    taille_octets BIGINT,
    statut VARCHAR(30) DEFAULT 'success' CHECK (statut IN ('success', 'error')),
    message TEXT,
    created_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: parametres
-- ============================================================
CREATE TABLE IF NOT EXISTS parametres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_numero ON patients(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_demandes_numero ON demandes(numero_demande);
CREATE INDEX IF NOT EXISTS idx_demandes_patient ON demandes(patient_id);
CREATE INDEX IF NOT EXISTS idx_demandes_date ON demandes(date_demande);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_resultats_demande ON resultats(demande_examen_id);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_actions(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_actions(created_at);

-- ============================================================
-- FONCTION: mise à jour automatique de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demandes_updated_at BEFORE UPDATE ON demandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resultats_updated_at BEFORE UPDATE ON resultats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utilisateurs_updated_at BEFORE UPDATE ON utilisateurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examens_updated_at BEFORE UPDATE ON examens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
