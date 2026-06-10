const { pool } = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initialisation de la base de données LaboKeb...');
    const schema = fs.readFileSync(path.join(__dirname, '../../../database/schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Schéma créé');
    const seed = fs.readFileSync(path.join(__dirname, '../../../database/seed.sql'), 'utf8');
    await client.query(seed);
    console.log('✅ Données initiales insérées');
    console.log('🎉 Base de données LaboKeb initialisée avec succès!');
    console.log('\n📋 Comptes par défaut:');
    console.log('  admin / Admin@2024 (Administrateur)');
    console.log('  technicien / Admin@2024 (Technicien)');
    console.log('  receptionniste / Admin@2024 (Réceptionniste)');
  } catch (error) {
    console.error('❌ Erreur initialisation:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDb().catch(console.error);
