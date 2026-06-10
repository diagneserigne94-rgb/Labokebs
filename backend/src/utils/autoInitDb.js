const pool = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function autoInitDb() {
  try {
    // Vérifier si les tables existent déjà
    const result = await pool.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'utilisateurs'
    `);
    
    if (result.rows[0].count === '0') {
      console.log('🔧 Initialisation de la base de données...');
      
      // Lire et exécuter schema.sql
      const schemaPath = path.join(__dirname, '../../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Schema créé');
      }
      
      // Lire et exécuter seed.sql
      const seedPath = path.join(__dirname, '../../../database/seed.sql');
      if (fs.existsSync(seedPath)) {
        const seed = fs.readFileSync(seedPath, 'utf8');
        await pool.query(seed);
        console.log('✅ Données initiales insérées');
      }
      
      console.log('✅ Base de données initialisée avec succès');
    } else {
      console.log('✅ Base de données déjà initialisée');
    }
  } catch (err) {
    console.error('❌ Erreur initialisation BDD:', err.message);
  }
}

module.exports = autoInitDb;
