const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { query } = require('../../config/database');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../../../backups');

const createBackup = async (userId, type = 'manuelle') => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `labokeb-backup-${type}-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  return new Promise((resolve, reject) => {
    const cmd = `pg_dump -h ${process.env.DB_HOST || 'localhost'} -U ${process.env.DB_USER || 'labokeb_user'} -d ${process.env.DB_NAME || 'labokeb'} -f "${filepath}"`;
    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

    exec(cmd, { env }, async (error, stdout, stderr) => {
      let statut = 'success', message = 'Sauvegarde réussie';
      let taille = 0;
      if (error) {
        statut = 'error'; message = error.message;
      } else {
        try { taille = fs.statSync(filepath).size; } catch (e) {}
      }
      try {
        await query(
          `INSERT INTO sauvegardes (nom_fichier, taille_octets, statut, message, created_by) VALUES ($1,$2,$3,$4,$5)`,
          [filename, taille, statut, message, userId]
        );
      } catch (e) { console.error('Erreur enregistrement sauvegarde:', e); }
      if (error) reject(error);
      else resolve({ filename, taille, message });
    });
  });
};

module.exports = { createBackup };
