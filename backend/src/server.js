const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares sécurité
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://labokeb.onrender.com',
    /\.onrender\.com$/
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const demandesRoutes = require('./routes/demandes');
const examensRoutes = require('./routes/examens');
const resultatsRoutes = require('./routes/resultats');
const statistiquesRoutes = require('./routes/statistiques');
const registreRoutes = require('./routes/registre');
const utilisateursRoutes = require('./routes/utilisateurs');
const dashboardRoutes = require('./routes/dashboard');
const pdfRoutes = require('./routes/pdf');
const backupRoutes = require('./routes/backup');
const parametresRoutes = require('./routes/parametres');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/examens', examensRoutes);
app.use('/api/resultats', resultatsRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/registre', registreRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/parametres', parametresRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'LaboKeb' }));

// Sauvegarde automatique à 23h
cron.schedule('0 23 * * *', async () => {
  console.log('💾 Sauvegarde automatique...');
  try {
    const { createBackup } = require('./utils/backup');
    await createBackup('auto');
  } catch (e) { console.error('Erreur sauvegarde:', e.message); }
});

// Démarrage
async function start() {
  try {
    const autoInitDb = require('./utils/autoInitDb');
    await autoInitDb();
  } catch (e) {
    console.error('Init DB error:', e.message);
  }
  app.listen(PORT, () => {
    console.log(`✅ LaboKeb API démarrée sur le port ${PORT}`);
  });
}

start();
