const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//============ MIDDLEWARES ============

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

//============ FICHIERS STATIQUES ============

app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));

//============ ROUTES AUTHENTIFICATION ============

const authRoutes = require('./routes/auth/auth.routes');
app.use('/api/auth', authRoutes);

//============ ROUTES UTILISATEUR ============

const userRoutes = require('./routes/user/user.routes');
app.use('/api/user', userRoutes);

//============ ROUTES CHRONIQUES ============

const chroniquesRoutes = require('./routes/chroniques/chroniques.routes');
app.use('/api/chroniques', chroniquesRoutes);

//============ ROUTE DE TEST ============

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'L\'Antre API fonctionne !', 
    timestamp: new Date().toISOString(),
    version: '4.0 - Architecture Refactorisée'
  });
});

//============ DÉMARRAGE SERVEUR ============

app.listen(PORT, () => {
  console.log(`🚀 L'Antre API démarrée sur http://localhost:${PORT}`);
});